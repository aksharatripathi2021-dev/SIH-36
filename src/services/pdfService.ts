import { Certificate } from "../types";
import { qrService } from "./qrService";

export const pdfService = {
  /**
   * Generates the self-contained printable HTML markup for a Digital Verification Certificate (Prototype representation)
   */
  async generateCertificateHtml(cert: Certificate): Promise<string> {
    const qrDataUrl = await qrService.generateCertificateQrDataUrl(cert.certificateId, 300);
    const verifyUrl = qrService.getVerificationUrl(cert.certificateId);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Digital Verification Certificate - ${cert.certificateId}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 24px;
      color: #0F172A;
      background: #F8FAFC;
      display: flex;
      justify-content: center;
    }
    .cert-frame {
      width: 100%;
      max-width: 800px;
      background: #FFFFFF;
      border: 6px double #0D1B2A;
      padding: 32px 40px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      position: relative;
    }
    .cert-header {
      text-align: center;
      border-bottom: 2px solid #0D1B2A;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .emblem-placeholder {
      font-size: 24px;
      font-weight: bold;
      color: #996B1F;
      margin-bottom: 6px;
    }
    .govt-title {
      font-size: 14px;
      font-weight: 700;
      color: #1E293B;
      letter-spacing: 0.5px;
      margin: 0;
    }
    .dept-title {
      font-size: 16px;
      font-weight: 800;
      color: #0D1B2A;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin: 4px 0;
    }
    .div-title {
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      margin: 0;
    }
    .cert-main-title {
      font-size: 20px;
      font-weight: 900;
      color: #0284C7;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin: 20px 0 6px 0;
    }
    .cert-act-subtitle {
      font-size: 10px;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 16px 0;
    }
    .status-ribbon {
      display: inline-block;
      background: #ECFDF5;
      color: #059669;
      border: 1px solid #A7F3D0;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
      padding: 4px 16px;
      border-radius: 9999px;
      margin-bottom: 20px;
    }
    .cert-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
      margin-bottom: 28px;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
    }
    .details-table td {
      padding: 8px 10px;
      font-size: 12px;
      border-bottom: 1px solid #E2E8F0;
    }
    .details-table td.label {
      color: #64748B;
      font-weight: 600;
      width: 45%;
    }
    .details-table td.value {
      color: #0F172A;
      font-weight: 700;
    }
    .qr-box {
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      background: #F8FAFC;
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .qr-img {
      width: 160px;
      height: 160px;
      display: block;
      margin-bottom: 8px;
    }
    .qr-caption {
      font-size: 10px;
      font-weight: 700;
      color: #0F172A;
      margin: 0;
    }
    .qr-subtext {
      font-size: 8px;
      color: #64748B;
      margin: 2px 0 0 0;
      word-break: break-all;
    }
    .statutory-footer {
      border-top: 1px solid #E2E8F0;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .authority-block {
      font-size: 11px;
      color: #334155;
    }
    .authority-name {
      font-weight: 800;
      color: #0F172A;
      margin-bottom: 2px;
    }
    .disclaimer-note {
      font-size: 9px;
      color: #94A3B8;
      max-width: 60%;
      line-height: 1.4;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .cert-frame {
        box-shadow: none;
        border: 4px double #0D1B2A;
      }
    }
  </style>
</head>
<body>
  <div class="cert-frame">
    <div class="cert-header">
      <div class="emblem-placeholder">🏛️</div>
      <p class="govt-title">भारत सरकार | Government of India</p>
      <h1 class="dept-title">उपभोक्ता मामले विभाग / Department of Consumer Affairs</h1>
      <p class="div-title">Legal Metrology Division • विधिक मापविज्ञान प्रभाग</p>

      <h2 class="cert-main-title">Digital Verification Certificate</h2>
      <p class="cert-act-subtitle">Prototype Certificate Representation • Legal Metrology (e-Mapan)</p>
      
      <div class="status-ribbon">Status: ${cert.status || "VALID"} • Result: ${cert.result || "Pass"}</div>
    </div>

    <div class="cert-grid">
      <table class="details-table">
        <tr>
          <td class="label">Certificate Number</td>
          <td class="value" style="font-family: monospace; color: #0284C7; font-size: 13px;">${cert.certificateId}</td>
        </tr>
        <tr>
          <td class="label">Application Reference</td>
          <td class="value" style="font-family: monospace;">${cert.applicationId}</td>
        </tr>
        <tr>
          <td class="label">Establishment / Trader</td>
          <td class="value">${cert.ownerName}</td>
        </tr>
        <tr>
          <td class="label">Instrument Verified</td>
          <td class="value">${cert.instrumentName}</td>
        </tr>
        <tr>
          <td class="label">Instrument ID</td>
          <td class="value" style="font-family: monospace;">${cert.instrumentId || "W-104"}</td>
        </tr>
        <tr>
          <td class="label">Verification Date</td>
          <td class="value">${cert.issuedDate}</td>
        </tr>
        <tr>
          <td class="label">Valid Until</td>
          <td class="value" style="color: #059669;">${cert.validUntil}</td>
        </tr>
        <tr>
          <td class="label">Verification Authority</td>
          <td class="value">${cert.issuingAuthority || "Delhi South Legal Metrology Office"}</td>
        </tr>
      </table>

      <div class="qr-box">
        <img src="${qrDataUrl}" alt="Verification QR Code" class="qr-img" />
        <p class="qr-caption">Public Verification QR</p>
        <p class="qr-subtext">Scan with e-Mapan or any camera</p>
      </div>
    </div>

    <div class="statutory-footer">
      <div class="disclaimer-note">
        <strong>Digital Record Notice:</strong> This is a computer-generated prototype digital verification certificate representation based on data recorded in the e-Mapan system. Physical verification QR sticker should be displayed on the verified instrument.
      </div>
      <div class="authority-block" style="text-align: right;">
        <div class="authority-name">${cert.issuingAuthority || "Legal Metrology Office"}</div>
        <div>Verification Authority Record</div>
        <div style="font-size: 9px; color: #64748B; margin-top: 4px;">PS36 Prototype Representation</div>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  },

  /**
   * Prints the certificate representation using the browser print dialog
   */
  async printCertificate(cert: Certificate): Promise<void> {
    if (typeof window === "undefined") return;
    const html = await this.generateCertificateHtml(cert);

    const printWindow = window.open("", "_blank", "width=850,height=950");
    if (!printWindow) {
      alert("Please allow popups to print the certificate.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 300);
    };
  },

  /**
   * Triggers download of the printable certificate as a self-contained HTML document
   */
  async downloadCertificate(cert: Certificate): Promise<void> {
    if (typeof window === "undefined") return;
    const html = await this.generateCertificateHtml(cert);

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Certificate-${cert.certificateId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
