import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { EnhancedCampaignAnalytics } from "./api/emailClient";

export interface PDFExportOptions {
  filename?: string;
  includeCharts?: boolean;
  includeMetrics?: boolean;
  campaignData?: any;
}

export interface LeadsnipperReportData {
  campaign: {
    name: string;
    subject?: string;
    sender: string;
    fromEmail: string;
    status: string;
    createdAt: string;
    startedAt?: string;
  };
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    replied: number;
    bounced: number;
    complained: number;
    unsubscribed: number;
    pending: number;
    failed: number;
    rejected: number;
  };
  steps?: Array<{
    stepNumber: number;
    subject: string;
    sent: number;
    opened: number;
    replied: number;
  }>;
  leads?: Array<{
    email: string;
    stepLabel: string;
    status: string;
    nextSend?: string;
  }>;
}

export function exportLeadsnipperCampaignReportPDF(
  data: LeadsnipperReportData,
  filename: string = `leadsnipper-campaign-report-${Date.now()}`
): void {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 14;
  let y = 16;

  const blue: [number, number, number] = [26, 108, 255];
  const slate: [number, number, number] = [17, 24, 39];
  const gray: [number, number, number] = [107, 114, 128];

  // Branded header
  pdf.setFillColor(248, 250, 252);
  pdf.rect(0, 0, pageWidth, 34, "F");
  pdf.setFillColor(...blue);
  pdf.circle(margin + 4, y + 1, 3, "F");
  pdf.setTextColor(...slate);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("LeadSnipper", margin + 10, y + 2);
  pdf.setFontSize(10);
  pdf.setTextColor(...gray);
  pdf.text("Campaign Analytics Report", margin + 10, y + 8);
  pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin, y + 8, {
    align: "right",
  });
  y = 42;

  const addSectionTitle = (title: string) => {
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...slate);
    pdf.setFontSize(12);
    pdf.text(title, margin, y);
    y += 6;
  };

  const drawMetricChip = (label: string, value: string, x: number, chipW: number) => {
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(229, 231, 235);
    pdf.roundedRect(x, y, chipW, 18, 2, 2, "FD");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...gray);
    pdf.text(label, x + 3, y + 6);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(...slate);
    pdf.text(value, x + 3, y + 13);
  };

  addSectionTitle("Campaign overview");
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(...slate);
  pdf.text(`Name: ${data.campaign.name}`, margin, y);
  y += 5;
  pdf.text(`Subject: ${data.campaign.subject || "N/A"}`, margin, y);
  y += 5;
  pdf.text(`Sender: ${data.campaign.sender} <${data.campaign.fromEmail}>`, margin, y);
  y += 5;
  pdf.text(`Status: ${data.campaign.status}`, margin, y);
  y += 5;
  pdf.text(`Created: ${data.campaign.createdAt}`, margin, y);
  y += 5;
  if (data.campaign.startedAt) {
    pdf.text(`Started: ${data.campaign.startedAt}`, margin, y);
    y += 5;
  }
  y += 3;

  addSectionTitle("Performance snapshot");
  const colGap = 4;
  const chipW = (pageWidth - margin * 2 - colGap * 2) / 3;
  drawMetricChip("Sent", String(data.metrics.sent), margin, chipW);
  drawMetricChip("Delivered", String(data.metrics.delivered), margin + chipW + colGap, chipW);
  drawMetricChip("Opened", String(data.metrics.opened), margin + (chipW + colGap) * 2, chipW);
  y += 22;
  drawMetricChip("Clicked", String(data.metrics.clicked), margin, chipW);
  drawMetricChip("Replied", String(data.metrics.replied), margin + chipW + colGap, chipW);
  drawMetricChip(
    "Queued",
    `${data.metrics.pending} leads`,
    margin + (chipW + colGap) * 2,
    chipW
  );
  y += 24;

  if (data.steps && data.steps.length > 0) {
    if (y > pageHeight - 60) {
      pdf.addPage();
      y = margin;
    }
    addSectionTitle("Sequence flow summary");
    pdf.setFontSize(9);
    data.steps.slice(0, 8).forEach((step) => {
      const openRate = step.sent > 0 ? ((step.opened / step.sent) * 100).toFixed(1) : "0.0";
      const line = `Step ${step.stepNumber}: ${step.subject} | Sent ${step.sent} | Open ${openRate}% | Replied ${step.replied}`;
      pdf.setTextColor(...slate);
      pdf.text(line.slice(0, 120), margin, y);
      y += 5;
    });
    y += 4;
  }

  if (data.leads && data.leads.length > 0) {
    if (y > pageHeight - 70) {
      pdf.addPage();
      y = margin;
    }
    addSectionTitle("Lead-level activity sample");
    pdf.setFontSize(8.5);
    pdf.setTextColor(...gray);
    pdf.text("Lead", margin, y);
    pdf.text("Step", margin + 70, y);
    pdf.text("Status", margin + 105, y);
    pdf.text("Next send", margin + 135, y);
    y += 4;
    pdf.setDrawColor(229, 231, 235);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 4;
    data.leads.slice(0, 10).forEach((lead) => {
      pdf.setTextColor(...slate);
      pdf.text(lead.email.slice(0, 35), margin, y);
      pdf.text(lead.stepLabel.slice(0, 18), margin + 70, y);
      pdf.text(lead.status, margin + 105, y);
      pdf.text((lead.nextSend || "-").slice(0, 22), margin + 135, y);
      y += 5;
    });
  }

  const pages = pdf.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    pdf.setDrawColor(229, 231, 235);
    pdf.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
    pdf.setFontSize(8);
    pdf.setTextColor(...gray);
    pdf.text(`LeadSnipper Confidential  •  Page ${i} of ${pages}`, pageWidth / 2, pageHeight - 5, {
      align: "center",
    });
  }

  pdf.save(`${filename}.pdf`);
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

  // Brand colors - Leadsnipper branding
  const primaryColor: [number, number, number] = [59, 130, 246]; // blue-500
  const secondaryColor: [number, number, number] = [16, 185, 129]; // emerald-500
  const textColor: [number, number, number] = [255, 255, 255]; // white
  const bgColor: [number, number, number] = [15, 23, 42]; // slate-900
  const lightBg: [number, number, number] = [248, 250, 252]; // slate-50

  // Header with branding
  pdf.setFillColor(...bgColor);
  pdf.rect(0, 0, pageWidth, 45, "F");

  pdf.setTextColor(...textColor);
  pdf.setFontSize(20);
  pdf.setFont("helvetica", "bold");
  pdf.text("Leadsnipper", margin, 20);

  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.text("Campaign Analytics Report", margin, 32);

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.text(
    `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
    margin,
    40
  );

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
    `Created: ${
      analytics.campaign.createdAt
        ? new Date(analytics.campaign.createdAt).toLocaleDateString()
        : "N/A"
    }`,
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

  // Chart Section - Capture all charts
  if (includeCharts && chartElement) {
    // Find all chart containers - look for divs containing ResponsiveContainer or recharts-wrapper
    const allDivs = chartElement.querySelectorAll("div");
    const chartContainers: HTMLElement[] = [];

    allDivs.forEach((div) => {
      // Check if this div contains a recharts component
      const hasRecharts =
        div.querySelector("svg.recharts-surface") ||
        div.querySelector('[class*="recharts"]') ||
        div.querySelector("svg[width]");

      // Check if it's a proper chart container (has title and reasonable size)
      const hasTitle = div.querySelector("h3, h4");
      const isContainer =
        div.classList.contains("rounded") ||
        div.classList.contains("rounded-lg");

      if (hasRecharts && (hasTitle || isContainer)) {
        // Make sure it's not a nested container
        let isNested = false;
        chartContainers.forEach((existing) => {
          if (existing.contains(div)) isNested = true;
        });

        if (!isNested && div.offsetHeight > 100) {
          chartContainers.push(div as HTMLElement);
        }
      }
    });

    // If we found chart containers, capture them
    if (chartContainers.length > 0) {
      for (let i = 0; i < chartContainers.length; i++) {
        const chartContainer = chartContainers[i];

        if (yPosition > pageHeight - 120) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(0, 0, 0);

        // Get chart title from the container
        const titleEl = chartContainer.querySelector("h3, h4");
        const chartTitle =
          titleEl?.textContent?.trim() || `Performance Chart ${i + 1}`;
        pdf.text(chartTitle, margin, yPosition);
        yPosition += 8;

        try {
          // Wait for any animations
          await new Promise((resolve) => setTimeout(resolve, 500));

          const canvas = await html2canvas(chartContainer, {
            backgroundColor: "#ffffff",
            scale: 1.5,
            logging: false,
            useCORS: true,
            allowTaint: false,
            removeContainer: false,
            windowWidth: chartContainer.scrollWidth,
            windowHeight: chartContainer.scrollHeight,
          });

          if (canvas.width === 0 || canvas.height === 0) {
            console.warn(`Chart ${i + 1} has zero dimensions, skipping`);
            continue;
          }

          const imgData = canvas.toDataURL("image/png", 0.95);

          // Validate PNG data
          if (
            !imgData ||
            imgData === "data:," ||
            !imgData.startsWith("data:image/png")
          ) {
            console.warn(
              `Chart ${i + 1} produced invalid image data, skipping`
            );
            continue;
          }

          const imgWidth = pageWidth - margin * 2;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          if (yPosition + imgHeight > pageHeight - 20) {
            pdf.addPage();
            yPosition = margin;
          }

          pdf.addImage(imgData, "PNG", margin, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 10;
        } catch (error) {
          console.error(`Failed to capture chart ${i + 1}:`, error);
          // Continue with next chart instead of breaking
          continue;
        }
      }
    } else {
      // Fallback: capture the entire container
      if (yPosition > pageHeight - 100) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text("Performance Trends", margin, yPosition);
      yPosition += 10;

      try {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const canvas = await html2canvas(chartElement, {
          backgroundColor: "#ffffff",
          scale: 1.5,
          logging: false,
          useCORS: true,
          allowTaint: false,
        });

        if (canvas.width > 0 && canvas.height > 0) {
          const imgData = canvas.toDataURL("image/png", 0.95);
          const imgWidth = pageWidth - margin * 2;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          pdf.addImage(imgData, "PNG", margin, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 10;
        }
      } catch (error) {
        console.error("Failed to capture chart:", error);
      }
    }
  }

  // Footer with branding
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);

    // Footer line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8, {
      align: "center",
    });

    pdf.setFontSize(7);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      "TotalAds - Email Campaign Analytics | Confidential Report",
      pageWidth / 2,
      pageHeight - 3,
      { align: "center" }
    );
  }

  pdf.save(`${filename}.pdf`);
}
