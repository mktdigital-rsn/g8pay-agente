import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";

// Helper function to wrap text for PDF insertion
function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + word).length > maxCharsPerLine) {
      lines.push(currentLine.trim());
      currentLine = word + " ";
    } else {
      currentLine += word + " ";
    }
  }
  if (currentLine) {
    lines.push(currentLine.trim());
  }
  return lines;
}

// Helper to get formatted date in Portuguese
function getFormattedDate(): string {
  const today = new Date();
  const months = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
  ];
  return `Porto Alegre, ${today.getDate()} de ${months[today.getMonth()]} de ${today.getFullYear()}.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fullName,
      cpf,
      email,
      whatsapp,
      cep,
      street,
      number,
      complement,
      neighborhood,
      city,
      state
    } = body;

    // Validation
    if (!fullName || !cpf || !email || !whatsapp || !cep || !street || !number || !neighborhood || !city || !state) {
      return NextResponse.json(
        { error: "Todos os campos obrigatórios devem ser preenchidos." },
        { status: 400 }
      );
    }

    // 1. Load PDF Template
    const pdfTemplateName = "termo_adesao_template.pdf";
    let pdfBytes: Buffer | null = null;

    // A. Try loading from public/ directory
    try {
      const publicPdfPath = path.join(process.cwd(), "public", pdfTemplateName);
      pdfBytes = fs.readFileSync(publicPdfPath);
    } catch (e) {
      console.log("Could not load PDF template from public/ directory via fs, trying root...");
    }

    // B. Try loading from root directory
    if (!pdfBytes) {
      try {
        const rootPdfPath = path.join(process.cwd(), pdfTemplateName);
        pdfBytes = fs.readFileSync(rootPdfPath);
      } catch (e) {
        console.log("Could not load PDF template from root directory via fs, trying HTTP fetch fallback...");
      }
    }

    // C. HTTP Fetch fallback (perfect for serverless functions on Netlify/Vercel where files are not bundled)
    if (!pdfBytes) {
      try {
        const baseUrl = request.nextUrl.origin;
        const fetchUrl = `${baseUrl}/${pdfTemplateName}`;
        console.log(`Attempting to fetch template via HTTP: ${fetchUrl}`);
        const fetchRes = await fetch(fetchUrl);
        if (!fetchRes.ok) {
          throw new Error(`HTTP fetch status ${fetchRes.status}`);
        }
        const arrayBuffer = await fetchRes.arrayBuffer();
        pdfBytes = Buffer.from(arrayBuffer);
      } catch (fetchError: any) {
        console.error("PDF template not found locally or via HTTP fetch:", fetchError);
        return NextResponse.json(
          { error: "Modelo de contrato PDF não pôde ser carregado no servidor." },
          { status: 500 }
        );
      }
    }

    // 2. Pre-fill PDF programmatically using pdf-lib
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Page 1 Modification
    const page1 = pdfDoc.getPage(0);
    // Draw white rectangle to hide placeholder
    page1.drawRectangle({
      x: 80,
      y: 555,
      width: 440,
      height: 65,
      color: rgb(1, 1, 1),
    });

    const addressStr = `${street}, nº ${number}${complement ? `, ${complement}` : ""}, ${neighborhood}, ${city} - ${state}, CEP ${cep}`;
    const qualText = `${fullName.toUpperCase()}, inscrito no CPF sob o nº ${cpf}, residente e domiciliado na ${addressStr}, telefone ${whatsapp}, e-mail ${email}, doravante denominado ADERENTE ou AGENTE.`;

    const lines = wrapText(qualText, 85);
    let currentY = 610;
    for (const line of lines) {
      page1.drawText(line, {
        x: 80,
        y: currentY,
        size: 9.5,
        font,
        color: rgb(0, 0, 0),
      });
      currentY -= 13;
    }

    // Page 5 Modification
    const page5 = pdfDoc.getPage(4);
    
    // Cover date text
    page5.drawRectangle({
      x: 80,
      y: 400,
      width: 350,
      height: 16,
      color: rgb(1, 1, 1),
    });

    // Draw today's date
    const dateStr = getFormattedDate();
    page5.drawText(dateStr, {
      x: 80,
      y: 405,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });

    // Cover signature name/CPF placeholders
    page5.drawRectangle({
      x: 90,
      y: 280,
      width: 200,
      height: 45,
      color: rgb(1, 1, 1),
    });

    // Draw Agent's name and CPF centered/left aligned
    page5.drawText(fullName.toUpperCase(), {
      x: 110,
      y: 312,
      size: 9,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    page5.drawText(`CPF: ${cpf}`, {
      x: 110,
      y: 295,
      size: 9,
      font,
      color: rgb(0, 0, 0),
    });

    // Save PDF
    const pdfOutBytes = await pdfDoc.save();

    // 3. Save a local backup copy to public/contratos (wrapped in try/catch for read-only serverless filesystems)
    const cleanCpf = cpf.replace(/\D/g, "");
    const localPdfFilename = `contrato_${cleanCpf}.pdf`;
    const localPdfUrl = `/contratos/${localPdfFilename}`;
    
    try {
      const contratosDir = path.join(process.cwd(), "public", "contratos");
      if (!fs.existsSync(contratosDir)) {
        fs.mkdirSync(contratosDir, { recursive: true });
      }
      const localPdfPath = path.join(contratosDir, localPdfFilename);
      fs.writeFileSync(localPdfPath, pdfOutBytes);
    } catch (fsError) {
      console.warn("Could not save local PDF backup (this is normal on read-only serverless environments like Netlify):", fsError);
    }

    // 4. Integrate with D4Sign
    const d4signApiToken = process.env.D4SIGN_API_TOKEN;
    const d4signCryptKey = process.env.D4SIGN_CRYPT_KEY || "";
    const d4signSafeUuid = process.env.D4SIGN_SAFE_UUID;
    const d4signEnv = process.env.NEXT_PUBLIC_D4SIGN_ENV || "sandbox";

    const isConfigured = !!(d4signApiToken && d4signSafeUuid);

    if (!isConfigured) {
      console.warn("D4Sign integration is not configured. Returning mock PDF.");
      const pdfBase64 = Buffer.from(pdfOutBytes).toString("base64");
      return NextResponse.json({
        success: true,
        signatureLink: localPdfUrl,
        isMock: true,
        pdfUrl: localPdfUrl,
        pdfBase64: pdfBase64,
        message: "Cadastro concluído. D4Sign em modo simulação (abrirá o PDF preenchido)."
      });
    }

    const d4signBaseUrl = d4signEnv === "production"
      ? "https://secure.d4sign.com.br/api/v1"
      : "https://sandbox.d4sign.com.br/api/v1";

    try {
      // Step A: Upload PDF to D4Sign
      const uploadUrl = `${d4signBaseUrl}/documents/${d4signSafeUuid}/upload?tokenAPI=${d4signApiToken}&cryptKey=${d4signCryptKey}`;
      
      const formData = new FormData();
      const pdfBlob = new Blob([pdfOutBytes as any], { type: "application/pdf" });
      formData.append("file", pdfBlob, `Termo_Adesao_G8Pay_${cleanCpf}.pdf`);

      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
        headers: {
          "Accept": "application/json"
        }
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        throw new Error(`D4Sign upload failed: ${errText}`);
      }

      const uploadData = await uploadRes.json();
      const docUuid = uploadData.uuid || uploadData.uuid_document;

      if (!docUuid) {
        throw new Error(`D4Sign did not return document UUID: ${JSON.stringify(uploadData)}`);
      }

      // Step B: Create signer list (createlist)
      const createlistUrl = `${d4signBaseUrl}/documents/${docUuid}/createlist?tokenAPI=${d4signApiToken}&cryptKey=${d4signCryptKey}`;
      const signersBody = {
        signers: [
          {
            email: email,
            act: "1", // 1 = Assinar
            foreign: "0",
            certificadoicpbr: "0",
            assinatura_presencial: "0",
            docauth: "0"
          }
        ]
      };

      const createlistRes = await fetch(createlistUrl, {
        method: "POST",
        body: JSON.stringify(signersBody),
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });

      if (!createlistRes.ok) {
        const errText = await createlistRes.text();
        throw new Error(`D4Sign createlist failed: ${errText}`);
      }

      // Extract key_signer
      let keySigner: string | null = null;
      try {
        const createlistData = await createlistRes.json();
        if (Array.isArray(createlistData)) {
          const signerObj = createlistData.find((s: any) => s.email === email);
          if (signerObj && signerObj.key_signer) {
            keySigner = signerObj.key_signer;
          }
        } else if (createlistData && typeof createlistData === "object") {
          if (Array.isArray(createlistData.signers)) {
            const signerObj = createlistData.signers.find((s: any) => s.email === email);
            if (signerObj && signerObj.key_signer) {
              keySigner = signerObj.key_signer;
            }
          } else if (createlistData.key_signer) {
            keySigner = createlistData.key_signer;
          }
        }
      } catch (e) {
        console.error("Failed to parse createlist response body", e);
      }

      // Fallback: list signers from the document if keySigner wasn't captured
      if (!keySigner) {
        const listUrl = `${d4signBaseUrl}/documents/${docUuid}/list?tokenAPI=${d4signApiToken}&cryptKey=${d4signCryptKey}`;
        const listRes = await fetch(listUrl, {
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          }
        });
        if (listRes.ok) {
          const listData = await listRes.json();
          if (Array.isArray(listData)) {
            const signerObj = listData.find((s: any) => s.email === email);
            if (signerObj && signerObj.key_signer) {
              keySigner = signerObj.key_signer;
            }
          }
        }
      }

      if (!keySigner) {
        throw new Error("Could not retrieve key_signer for the registered agent.");
      }

      // Step B2: Position the signature (pins) on page 5
      try {
        const addpinsUrl = `${d4signBaseUrl}/documents/${docUuid}/addpins?tokenAPI=${d4signApiToken}&cryptKey=${d4signCryptKey}`;
        const pinsBody = {
          pins: [
            {
              document: docUuid,
              email: email,
              page: 5,
              page_width: 794,
              page_height: 1123,
              position_x: 225,
              position_y: 635,
              type: 0 // 0 = Signature
            }
          ]
        };

        const addpinsRes = await fetch(addpinsUrl, {
          method: "POST",
          body: JSON.stringify(pinsBody),
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          }
        });

        if (!addpinsRes.ok) {
          const errText = await addpinsRes.text();
          console.error(`D4Sign addpins failed: ${errText} (continuing anyway)`);
        } else {
          console.log(`Successfully positioned D4Sign signature pin for ${email} on page 5`);
        }
      } catch (pinError) {
        console.error("Error positioning D4Sign signature pin (continuing anyway):", pinError);
      }

      // Step C: Send document for signature (sendtosigner)
      const sendUrl = `${d4signBaseUrl}/documents/${docUuid}/sendtosigner?tokenAPI=${d4signApiToken}&cryptKey=${d4signCryptKey}`;
      const sendBody = {
        message: "Olá! Por favor, assine o Termo de Adesão de Agente G8Pay.",
        skip_email: "0", // 0 = Enviar e-mail de notificação
        workflow: "0"
      };

      const sendRes = await fetch(sendUrl, {
        method: "POST",
        body: JSON.stringify(sendBody),
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });

      if (!sendRes.ok) {
        const errText = await sendRes.text();
        throw new Error(`D4Sign sendtosigner failed: ${errText}`);
      }

      // Step D: Get specific signature link
      const sigLinkUrl = `${d4signBaseUrl}/documents/${docUuid}/signaturelink/${keySigner}?tokenAPI=${d4signApiToken}&cryptKey=${d4signCryptKey}`;
      const sigLinkRes = await fetch(sigLinkUrl, {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      });

      if (!sigLinkRes.ok) {
        const errText = await sigLinkRes.text();
        throw new Error(`D4Sign signaturelink failed: ${errText}`);
      }

      const sigLinkData = await sigLinkRes.json();
      const signatureLink = sigLinkData.link || sigLinkData.url;

      if (!signatureLink) {
        throw new Error(`D4Sign signaturelink response did not contain link: ${JSON.stringify(sigLinkData)}`);
      }

      const pdfBase64 = Buffer.from(pdfOutBytes).toString("base64");
      return NextResponse.json({
        success: true,
        signatureLink: signatureLink,
        documentUuid: docUuid,
        pdfUrl: localPdfUrl,
        pdfBase64: pdfBase64,
        isMock: false
      });

    } catch (d4Error: any) {
      console.error("D4Sign API error, falling back to mock PDF:", d4Error);
      const pdfBase64 = Buffer.from(pdfOutBytes).toString("base64");
      return NextResponse.json({
        success: true,
        signatureLink: localPdfUrl,
        isMock: true,
        pdfUrl: localPdfUrl,
        pdfBase64: pdfBase64,
        warning: "A API da D4Sign retornou um erro, mas o contrato foi gerado localmente.",
        errorDetail: d4Error.message
      });
    }

  } catch (error: any) {
    console.error("Onboarding contract API handler error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao gerar o contrato de adesão." },
      { status: 500 }
    );
  }
}
