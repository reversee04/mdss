import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { AuditAction, AuditCategory, AuditService, AuditSeverity } from "@/services/audit.service";

export const { handlers, signIn, signOut, auth } = NextAuth({
    secret: process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production",
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string }
                });

                if (!user) {
                    await AuditService.log({
                        userId: null,
                        action: AuditAction.LOGIN_FAILED,
                        entityAffected: "User",
                        details: `Failed login attempt for unknown email ${credentials.email}`,
                        severity: AuditSeverity.WARNING,
                        category: AuditCategory.AUTH,
                    });
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password_hash
                );

                if (!isPasswordValid) {
                    await AuditService.log({
                        userId: user.user_id,
                        action: AuditAction.LOGIN_FAILED,
                        entityAffected: "User",
                        entityId: user.user_id,
                        details: `Failed login attempt for ${user.email}`,
                        severity: AuditSeverity.WARNING,
                        category: AuditCategory.AUTH,
                    });
                    return null;
                }

                // Update last login time
                await prisma.user.update({
                    where: { user_id: user.user_id },
                    data: { last_login: new Date() }
                });

                await AuditService.log({
                    userId: user.user_id,
                    action: AuditAction.LOGIN,
                    entityAffected: "User",
                    entityId: user.user_id,
                    details: `User ${user.email} logged in`,
                    category: AuditCategory.AUTH,
                });

                return {
                    id: user.user_id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    status: user.status,
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.status = user.status;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.status = token.status as string;
            }
            return session;
        }
    },
    events: {
        async signOut(message: any) {
            const userId = message?.token?.id || message?.token?.sub || message?.session?.user?.id;
            await AuditService.log({
                userId: userId || null,
                action: AuditAction.LOGOUT,
                entityAffected: "User",
                entityId: userId || null,
                details: "User logged out",
                category: AuditCategory.AUTH,
            });
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    }
})
