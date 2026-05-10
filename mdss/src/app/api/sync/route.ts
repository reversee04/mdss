import {prisma} from '@/lib/prisma';
import {processSync} from '@/services/processSync';

export async function POST(req: Request){
    try{
        const body =  await req.json();

        //validate source hospital
        if (!body.sourceHospital) {
            return Response.json(
                {
                    success: false,
                    message: "Source hospital is required"
                },
                {status: 400}
                
            );
        }

        await processSync(body);

        return Response.json({
            success: true,
            message: "Sync process completed successfully"
        });
    } catch (error) {        console.error("Error during sync process:", error);
        return Response.json({
            success: false,
            message: "An error occurred during the sync process"
        },
        {status: 500}
        );
    }
}