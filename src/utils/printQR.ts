import QRCode from "qrcode"

export interface PrintQROptions {
    url: string
    title: string
    subtitle?: string
    instruction?: string
}

export async function printQR({ url, title, subtitle = 'SureYummy', instruction = 'Scan QR Code untuk memesan' }: PrintQROptions): Promise<{ success: boolean; error?: string }> {
    try {
        // Generate QR code as data URL
        const qrDataUrl = await QRCode.toDataURL(url, {
            width: 400,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        })

        // Create a new window for printing
        const printWindow = window.open('', '_blank')
        if (!printWindow) {
            return { success: false, error: 'Mohon izinkan popup untuk mencetak QR Code' }
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>QR Code - ${title}</title>
                <style>
                    body {
                        font-family: 'Plus Jakarta Sans', sans-serif;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        margin: 0;
                        padding: 20px;
                    }
                    .container {
                        text-align: center;
                        border: 2px solid #000;
                        padding: 40px;
                        border-radius: 12px;
                    }
                    h1 {
                        font-size: 48px;
                        margin: 0 0 10px 0;
                        font-weight: bold;
                    }
                    .subtitle {
                        font-size: 24px;
                        color: #666;
                        margin: 0 0 30px 0;
                    }
                    img {
                        display: block;
                        margin: 0 auto;
                    }
                    .instruction {
                        margin-top: 30px;
                        font-size: 20px;
                        color: #333;
                    }
                    @media print {
                        body {
                            background: white;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>${title}</h1>
                    <p class="subtitle">${subtitle}</p>
                    <img src="${qrDataUrl}" alt="QR Code" />
                    <p class="instruction">${instruction}</p>
                </div>
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 500);
                    }
                    window.onafterprint = function() {
                        window.close();
                    }
                </script>
            </body>
            </html>
        `)
        printWindow.document.close()
        
        return { success: true }
    } catch (error) {
        console.error('Error generating QR code:', error)
        return { success: false, error: 'Gagal membuat QR Code' }
    }
}
