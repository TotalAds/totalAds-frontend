import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { EnhancedCampaignAnalytics } from "./api/emailClient";

export interface PDFExportOptions {
  filename?: string;
  includeCharts?: boolean;
  includeMetrics?: boolean;
}

export async function exportCampaignAnalyticsToPDF(
  analytics: EnhancedCampaignAnalytics,
  chartElement: HTMLElement | null,
  options: PDFExportOptions = {}
): Promise<void> {
  const {
    filename = `campaign-analytics-${analytics.campaign.id}`,
    includeCharts = true,
    includeMetrics = true,
  } = options;

  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // Brand colors
  const primaryColor: [number, number, number] = [235, 133, 122]; // #eb857a
  const textColor: [number, number, number] = [250, 250, 250]; // #fafafa
  const bgColor: [number, number, number] = [26, 26, 29]; // #1a1a1d

  // Header
  pdf.setFillColor(...bgColor);
  pdf.rect(0, 0, pageWidth, 40, "F");

  pdf.setTextColor(...textColor);
  pdf.setFontSize(24);
  pdf.setFont("helvetica", "bold");
  pdf.text("Campaign Analytics Report", margin, 25);

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Generated on ${new Date().toLocaleDateString()}`, margin, 35);

  yPosition = 50;

  // Campaign Info Section
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text("Campaign Details", margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");
  const campaignDetails = [
    `Name: ${analytics.campaign.name}`,
    `Subject: ${analytics.campaign.subject || "N/A"}`,
    `From: ${analytics.campaign.fromName} <${analytics.campaign.fromEmail}>`,
    `Status: ${analytics.campaign.status}`,
    `Created: ${analytics.campaign.createdAt ? new Date(analytics.campaign.createdAt).toLocaleDateString() : "N/A"}`,
  ];

  campaignDetails.forEach((detail) => {
    pdf.text(detail, margin, yPosition);
    yPosition += 7;
  });

  yPosition += 10;

  // Metrics Section
  if (includeMetrics) {
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("Performance Metrics", margin, yPosition);
    yPosition += 10;

    // Create metrics table
    const metrics = [
      ["Metric", "Count", "Rate"],
      ["Total Sent", analytics.summary.totalSent.toString(), "-"],
      [
        "Delivered",
        analytics.summary.totalDelivered.toString(),
        `${analytics.rates.deliveryRate}%`,
      ],
      [
        "Opened",
        analytics.summary.totalOpened.toString(),
        `${analytics.rates.openRate}%`,
      ],
      [
        "Clicked",
        analytics.summary.totalClicked.toString(),
        `${analytics.rates.clickRate}%`,
      ],
      [
        "Bounced",
        analytics.summary.totalBounced.toString(),
        `${analytics.rates.bounceRate}%`,
      ],
      [
        "Complained",
        analytics.summary.totalComplained.toString(),
        `${analytics.rates.complaintRate}%`,
      ],
      [
        "Unsubscribed",
        analytics.summary.totalUnsubscribed.toString(),
        `${analytics.rates.unsubscribeRate}%`,
      ],
    ];

    const colWidths = [60, 40, 40];
    const rowHeight = 8;

    metrics.forEach((row, rowIndex) => {
      let xPos = margin;
      row.forEach((cell, colIndex) => {
        if (rowIndex === 0) {
          pdf.setFillColor(...primaryColor);
          pdf.rect(xPos, yPosition - 5, colWidths[colIndex], rowHeight, "F");
          pdf.setTextColor(255, 255, 255);
          pdf.setFont("helvetica", "bold");
        } else {
          pdf.setTextColor(0, 0, 0);
          pdf.setFont("helvetica", "normal");
          if (rowIndex % 2 === 0) {
            pdf.setFillColor(245, 245, 245);
            pdf.rect(xPos, yPosition - 5, colWidths[colIndex], rowHeight, "F");
          }
        }
        pdf.setFontSize(10);
        pdf.text(cell, xPos + 3, yPosition);
        xPos += colWidths[colIndex];
      });
      yPosition += rowHeight;
    });

    yPosition += 15;
  }

  // Chart Section
  if (includeCharts && chartElement) {
    if (yPosition > pageHeight - 100) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("Performance Trends", margin, yPosition);
    yPosition += 10;

    try {
      const canvas = await html2canvas(chartElement, {
        backgroundColor: "#1a1a1d",
        scale: 2,
      });
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", margin, yPosition, imgWidth, imgHeight);
    } catch (error) {
      console.error("Failed to capture chart:", error);
    }
  }

  // Footer
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(
      `Page ${i} of ${totalPages} | LeadSnipper Campaign Analytics`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  pdf.save(`${filename}.pdf`);
}

