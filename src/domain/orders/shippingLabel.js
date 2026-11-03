// Generador de etiquetas de transporte oficiales para impresión (formato estándar 10x15cm / Carta).
// Compatible con impresoras térmicas (Zebra, Xprinter) e impresoras convencionales.

import { formatMoney } from '../shared/money.js';

/**
 * Genera un código de barras SVG estilizado para la guía.
 */
function generateBarcodeSvg(code) {
    const cleanCode = String(code).toUpperCase().replace(/[^A-Z0-9-]/g, '');
    let bars = '';
    let x = 15;

    // Generar barras variables según los caracteres del código
    for (let i = 0; i < cleanCode.length; i++) {
        const charCode = cleanCode.charCodeAt(i);
        const w1 = ((charCode % 3) + 1.5) * 1.8;
        const w2 = (((charCode >> 1) % 2) + 1) * 2;
        const gap = ((charCode % 2) + 1.2) * 1.5;

        bars += `<rect x="${x}" y="10" width="${w1}" height="55" fill="#000000" />`;
        x += w1 + gap;
        bars += `<rect x="${x}" y="10" width="${w2}" height="55" fill="#000000" />`;
        x += w2 + gap + 1;
    }

    const totalWidth = Math.max(300, x + 20);

    return `
        <svg viewBox="0 0 ${totalWidth} 85" width="100%" height="80" xmlns="http://www.w3.org/2000/svg">
            ${bars}
            <text x="${totalWidth / 2}" y="78" text-anchor="middle" font-family="monospace" font-size="14" font-weight="bold" fill="#000">${cleanCode}</text>
        </svg>
    `;
}

/**
 * Genera el documento HTML completo de la etiqueta para impresión.
 */
export function buildShippingLabelHtml({ order, shippingData, sender }) {
    const carrier = shippingData.carrier || order.shippingCarrier || 'Coordinadora Mercantil';
    const guideNumber = shippingData.guideNumber || order.shippingGuideNumber || 'COORD-000000';
    const customer = order.customer || {};
    const specs = shippingData.specs || {
        weightKg: 1,
        dimensions: '15x15x15 cm',
        declaredValue: order.total || 0,
        content: 'Herramientas y repuestos de tecnología',
    };

    const dateFormatted = new Date().toLocaleDateString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Guía de Despacho ${guideNumber} - ${carrier}</title>
    <style>
        @page {
            size: 100mm 150mm;
            margin: 0;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            background-color: #f3f4f6;
            color: #111827;
            padding: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .toolbar {
            width: 100%;
            max-width: 400px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .btn-print {
            background-color: #111827;
            color: #ffffff;
            border: none;
            padding: 10px 18px;
            font-size: 13px;
            font-weight: 600;
            border-radius: 6px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .btn-print:hover {
            background-color: #374151;
        }
        .label-container {
            width: 100mm;
            min-height: 145mm;
            background: #ffffff;
            border: 2px solid #000000;
            padding: 12px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #000;
            padding-bottom: 8px;
        }
        .carrier-name {
            font-size: 17px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .order-badge {
            font-size: 11px;
            font-weight: 700;
            background: #000;
            color: #fff;
            padding: 2px 6px;
            border-radius: 3px;
        }
        .barcode-section {
            text-align: center;
            padding: 6px 0;
            border-bottom: 2px solid #000;
        }
        .section {
            border-bottom: 1.5px solid #000;
            padding: 8px 0;
            font-size: 11px;
            line-height: 1.35;
        }
        .section:last-child {
            border-bottom: none;
        }
        .section-title {
            font-size: 9px;
            text-transform: uppercase;
            font-weight: 800;
            letter-spacing: 0.8px;
            color: #4b5563;
            margin-bottom: 3px;
        }
        .party-name {
            font-size: 13px;
            font-weight: 800;
            text-transform: uppercase;
        }
        .party-detail {
            font-size: 11px;
            font-weight: 500;
        }
        .destination-highlight {
            background-color: #f3f4f6;
            border: 1.5px dashed #000;
            padding: 6px 8px;
            margin-top: 4px;
            border-radius: 4px;
        }
        .specs-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 4px;
            font-size: 10px;
        }
        .specs-cell {
            background: #f9fafb;
            padding: 4px;
            border: 1px solid #e5e7eb;
        }
        .specs-cell strong {
            display: block;
            font-size: 11px;
            color: #000;
        }
        .fragile-banner {
            background: #fee2e2;
            border: 1.5px solid #ef4444;
            color: #991b1b;
            text-align: center;
            font-size: 10px;
            font-weight: 800;
            padding: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 6px;
        }
        @media print {
            body {
                background: #ffffff;
                padding: 0;
            }
            .toolbar {
                display: none;
            }
            .label-container {
                border: 2px solid #000;
                width: 100mm;
                height: 150mm;
                page-break-after: always;
            }
        }
    </style>
</head>
<body>
    <div class="toolbar">
        <span style="font-size: 12px; color: #6b7280;">Etiqueta térmica oficial (10x15 cm)</span>
        <button class="btn-print" onclick="window.print()">🖨️ Imprimir Guía</button>
    </div>

    <div class="label-container">
        <!-- Encabezado Transportadora -->
        <div class="header">
            <div>
                <div class="carrier-name">${carrier}</div>
                <div style="font-size: 10px; color: #4b5563;">SERVICIO NACIONAL PAQUETERÍA</div>
            </div>
            <div style="text-align: right;">
                <div class="order-badge">PEDIDO #${order.code}</div>
                <div style="font-size: 9px; margin-top: 2px; color: #6b7280;">${dateFormatted}</div>
            </div>
        </div>

        <!-- Código de Barras -->
        <div class="barcode-section">
            ${generateBarcodeSvg(guideNumber)}
        </div>

        <!-- Destinatario (Principal) -->
        <div class="section">
            <div class="section-title">DESTINATARIO (ENTREGAR EN):</div>
            <div class="party-name">${customer.fullName || 'Cliente'}</div>
            <div class="destination-highlight">
                <div class="party-detail"><strong>Dirección:</strong> ${customer.address || ''}</div>
                <div class="party-detail"><strong>Ciudad / Depto:</strong> <span style="font-size: 13px; font-weight: 800; text-transform: uppercase;">${customer.city || ''}</span></div>
            </div>
            <div class="party-detail" style="margin-top: 4px;">
                <strong>Teléfono:</strong> ${customer.phone || ''} · <strong>Email:</strong> ${customer.email || ''}
            </div>
            ${customer.notes ? `<div style="font-size: 10px; font-style: italic; margin-top: 3px; color: #374151;">Notas: "${customer.notes}"</div>` : ''}
        </div>

        <!-- Remitente -->
        <div class="section">
            <div class="section-title">REMITENTE:</div>
            <div class="party-name" style="font-size: 11px;">${sender.name || 'AROMA PREMIUM COLOMBIA'}</div>
            <div class="party-detail">${sender.address || 'Calle 10 # 43E-20, El Poblado'} - ${sender.city || 'Medellín, Antioquia'}</div>
            <div class="party-detail">NIT: ${sender.nit || '901.458.291-3'} · Tel: ${sender.phone || '3146160642'}</div>
        </div>

        <!-- Especificaciones del Paquete -->
        <div class="section">
            <div class="specs-grid">
                <div class="specs-cell">
                    <span>Peso Real:</span>
                    <strong>${specs.weightKg || 1} Kg</strong>
                </div>
                <div class="specs-cell">
                    <span>Dimensiones:</span>
                    <strong>${specs.dimensions || '15x15x15'}</strong>
                </div>
                <div class="specs-cell">
                    <span>Valor Declarado:</span>
                    <strong>${formatMoney(specs.declaredValue || order.total || 0)}</strong>
                </div>
            </div>
            <div style="font-size: 10px; margin-top: 4px;">
                <strong>Contenido:</strong> ${specs.content || 'Equipos y herramientas de tecnología'}
            </div>
            <div class="fragile-banner">
                ⚠️ EQUIPO ELECTRÓNICO Y DE PRECISIÓN · MANEJAR CON CUIDADO
            </div>
        </div>

        <!-- Pie de guía -->
        <div style="text-align: center; font-size: 8px; color: #9ca3af; padding-top: 4px;">
            Guía generada por Aroma Premium E-commerce · Sistema Automatizado de Envíos
        </div>
    </div>
</body>
</html>`;
}

/**
 * Abre la etiqueta en una ventana nueva lista para imprimir.
 */
export function openShippingLabelWindow({ order, shippingData, sender }) {
    if (typeof window === 'undefined') return;

    // Si ya viene una URL directa de la API de la transportadora (e.g. PDF en servidor de Mi Paquete)
    if (shippingData.labelUrl && shippingData.labelUrl.startsWith('http')) {
        window.open(shippingData.labelUrl, '_blank', 'noopener,noreferrer');
        return;
    }

    const html = buildShippingLabelHtml({ order, shippingData, sender });
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
        win.focus();
    }
}
