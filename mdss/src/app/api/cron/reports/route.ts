import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/services/email.service';
import { PDFService } from '@/services/pdf.service';
import { ExcelService } from '@/services/excel.service';
import { StorageService } from '@/services/storage.service';

export async function GET(request: NextRequest) {
  // Validate cron secret in a real app, omitted for simplicity since it's just a PoC
  
  try {
    const scheduledTemplates = await prisma.reportTemplate.findMany({
      where: {
        schedule_enabled: true,
        OR: [
          { next_run: null },
          { next_run: { lte: new Date() } },
        ]
      },
      include: { user: true },
    });

    const storageService = new StorageService();

    let processedCount = 0;

    for (const template of scheduledTemplates) {
      // Mock data fetching, in reality we'd use analytics.service
      // Since cron doesn't have request context, we fake some report data
      const reportData = {
        encounters: { totalEncounters: Math.floor(Math.random() * 1000) },
        filters: template.filters,
      };

      let fileBuffer: Buffer | null = null;
      let contentType = '';
      let fileExtension = '';

      if (template.export_format === 'pdf') {
        const pdfService = new PDFService();
        fileBuffer = pdfService.generateReportPDF(reportData, { reportName: template.template_name });
        contentType = 'application/pdf';
        fileExtension = 'pdf';
      } else {
        const excelService = new ExcelService();
        fileBuffer = excelService.generateReportExcel(reportData, { reportName: template.template_name });
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileExtension = 'xlsx';
      }

      const filename = `scheduled-${template.template_name}-${Date.now()}.${fileExtension}`;
      const filePath = await storageService.saveFile(fileBuffer, filename, contentType);

      const generated = await prisma.generatedReport.create({
        data: {
          user_id: template.user_id,
          template_id: template.id,
          report_name: template.template_name,
          report_type: template.report_type,
          file_path: filePath,
          file_size: fileBuffer.length,
          format: fileExtension,
          filters_used: template.filters as any,
        }
      });

      // Send Email
      await sendEmail({
        to: [template.user.email],
        subject: `Scheduled Report: ${template.template_name}`,
        html: `<p>Your scheduled report ${template.template_name} has been generated.</p>`,
        attachments: [
          { filename, path: process.cwd() + '/public' + filePath }
        ]
      });

      // Update next_run (simplified to add 1 day)
      const nextRun = new Date();
      nextRun.setDate(nextRun.getDate() + 1);

      await prisma.reportTemplate.update({
        where: { id: template.id },
        data: {
          last_run: new Date(),
          next_run: nextRun,
        }
      });

      processedCount++;
    }

    return NextResponse.json({ success: true, processed: processedCount });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Failed to process scheduled reports' }, { status: 500 });
  }
}
