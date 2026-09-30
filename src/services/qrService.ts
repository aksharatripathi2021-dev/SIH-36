import QRCode from "qrcode";
import { Certificate } from "../types";

export const qrService = {
  /**
   * Builds the relative or absolute public verification URL for a given certificate ID
   */
  getVerificationUrl(certificateId: string): string {
    const trimmedId = certificateId.trim().toUpperCase();
    if (typeof window !== "undefined" && window.location?.origin) {
      return `${window.location.origin}/verify-certificate?id=${encodeURIComponent(trimmedId)}`;
    }
    return `/verify-certificate?id=${encodeURIComponent(trimmedId)}`;
  },

  /**
   * Generates a Data URL (base64 image/png) for a QR code that encodes the public verification link
   */
  async generateCertificateQrDataUrl(certificateId: string, width = 256): Promise<string> {
    const url = this.getVerificationUrl(certificateId);
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        errorCorrectionLevel: "H",
        margin: 2,
        width,
        color: {
          dark: "#0D1B2A",
          light: "#FFFFFF"
        }
      });
      return dataUrl;
    } catch (err) {
      console.error("[qrService] Failed to generate QR data URL:", err);
      return "";
    }
  },

  /**
   * Generates an SVG string representation of the QR code
   */
  async generateCertificateQrSvg(certificateId: string): Promise<string> {
    const url = this.getVerificationUrl(certificateId);
    try {
      const svg = await QRCode.toString(url, {
        type: "svg",
        errorCorrectionLevel: "H",
        margin: 2,
        color: {
          dark: "#0D1B2A",
          light: "#FFFFFF"
        }
      });
      return svg;
    } catch (err) {
      console.error("[qrService] Failed to generate QR SVG:", err);
      return "";
    }
  },

  /**
   * Triggers download of high-resolution QR image (PNG)
   */
  async downloadQrImage(certificateId: string, filename?: string): Promise<void> {
    if (typeof window === "undefined") return;
    const dataUrl = await this.generateCertificateQrDataUrl(certificateId, 600);
    if (!dataUrl) return;

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename || `QR-Sticker-${certificateId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Opens a print-ready window for a standardized 80mm shop QR sticker
   */
  async printQrSticker(certificateId: string, details?: Partial<Certificate>): Promise<void> {
    if (typeof window === "undefined") return;
    const qrDataUrl = await this.generateCertificateQrDataUrl(certificateId, 500);
    const verifyUrl = this.getVerificationUrl(certificateId);

    const printWindow = window.open("", "_blank", "width=600,height=700");
    if (!printWindow) {
      alert("Please allow popups to print the QR sticker.");
      return;
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>e-Tarazu QR Sticker - ${certificateId}</title>
  <style>
    @page {
      size: 100mm 120mm;
      margin: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 16px;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #f8fafc;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sticker-card {
      width: 90mm;
      background: white;
      border: 2px dashed #0D1B2A;
      border-radius: 12px;
      padding: 16px;
      box-sizing: border-box;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .badge {
      display: inline-block;
      background: #0D1B2A;
      color: white;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    .dept-title {
      font-size: 11px;
      font-weight: 800;
      color: #0F172A;
      margin: 0;
      line-height: 1.3;
    }
    .dept-sub {
      font-size: 9px;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 2px 0 12px 0;
    }
    .qr-container {
      background: #FFFFFF;
      padding: 8px;
      display: inline-block;
      border-radius: 8px;
      border: 1px solid #E2E8F0;
    }
    .qr-img {
      width: 170px;
      height: 170px;
      display: block;
    }
    .cert-id {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px;
      font-weight: 700;
      color: #0284C7;
      margin-top: 8px;
      letter-spacing: 0.5px;
    }
    .inst-name {
      font-size: 11px;
      font-weight: 600;
      color: #1E293B;
      margin: 4px 0 0 0;
    }
    .valid-until {
      font-size: 10px;
      color: #16A34A;
      font-weight: 700;
      margin: 4px 0 12px 0;
    }
    .scan-note {
      font-size: 9px;
      color: #64748B;
      border-top: 1px solid #E2E8F0;
      padding-top: 8px;
      margin: 0;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .sticker-card {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="sticker-card">
    <div class="badge">Legal Metrology e-Tarazu</div>
    <div class="dept-title">DEPARTMENT OF CONSUMER AFFAIRS</div>
    <div class="dept-sub">Verified Measuring Instrument</div>
    <div class="qr-container">
      <img src="${qrDataUrl}" alt="Verification QR" class="qr-img" />
    </div>
    <div class="cert-id">${certificateId}</div>
    ${details?.instrumentName ? `<div class="inst-name">${details.instrumentName}</div>` : ""}
    ${details?.validUntil ? `<div class="valid-until">Valid Until: ${details.validUntil}</div>` : ""}
    <p class="scan-note">
      Scan with any QR scanner to verify digital verification record on the e-Tarazu portal.<br>
      <strong>PS36 e-Tarazu Prototype</strong>
    </p>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
};
