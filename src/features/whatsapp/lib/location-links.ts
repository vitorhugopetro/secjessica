/**
 * Gerador de Links Diretos de Navegação e Mobilidade:
 * Google Maps, Waze e Uber com 1 clique
 */

export interface LocationNavigationLinks {
  address: string;
  googleMapsUrl: string;
  wazeUrl: string;
  uberUrl: string;
  formattedWhatsAppText: string;
}

export function buildLocationLinks(address: string): LocationNavigationLinks {
  const cleanAddress = (address || "").trim();
  const encoded = encodeURIComponent(cleanAddress);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
  const wazeUrl = `https://waze.com/ul?q=${encoded}&navigate=yes`;
  const uberUrl = `https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]=${encoded}`;

  const formattedWhatsAppText = [
    `📍 *Endereço da Clínica / Consultório:*`,
    `_${cleanAddress}_`,
    ``,
    `🗺️ *Google Maps:* ${googleMapsUrl}`,
    `🚗 *Abrir no Waze:* ${wazeUrl}`,
    `🚕 *Pedir um Uber até o Local:* ${uberUrl}`,
  ].join("\n");

  return {
    address: cleanAddress,
    googleMapsUrl,
    wazeUrl,
    uberUrl,
    formattedWhatsAppText,
  };
}
