// Koordinatani manzilga aylantiradi. Ikkala xizmat ham bepul va kalitsiz.
// Faqat foydalanuvchi "Mening joylashuvim"ni bosganda, bir marta chaqiriladi.
// Natija: { title: "Ko'cha, mahalla", subtitle: "Tuman, shahar" } yoki null

// 1) OpenStreetMap Nominatim: ko'cha darajasigacha aniq
const fetchNominatimAddress = async (latitude, longitude, lang) => {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: latitude,
    lon: longitude,
    zoom: "17",
    "accept-language": lang,
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`);

  if (!response.ok) {
    throw new Error(`Nominatim error: ${response.status}`);
  }

  const { address } = await response.json();

  if (!address) return null;

  const street = [address.road, address.house_number].filter(Boolean).join(" ");
  const area = address.neighbourhood || address.suburb || address.quarter;
  const district = address.district || address.city_district || address.county;
  const city = address.city || address.town || address.village || address.state;

  const title = [street, area].filter(Boolean).join(", ") || district || city;
  const subtitle = [district, city].filter((part) => part && part !== title).join(", ");

  return title ? { title, subtitle } : null;
};

// 2) Zaxira - BigDataCloud: faqat tuman va shahar
const fetchBigDataCloudAddress = async (latitude, longitude, lang) => {
  const params = new URLSearchParams({ latitude, longitude, localityLanguage: lang });

  const response = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?${params}`
  );

  if (!response.ok) {
    throw new Error(`BigDataCloud error: ${response.status}`);
  }

  const data = await response.json();

  const title = data.locality || data.city || data.principalSubdivision;
  const subtitle = [data.city, data.countryName]
    .filter((part) => part && part !== title)
    .join(", ");

  return title ? { title, subtitle } : null;
};

// lang - manzil qaysi tilda qaytishi: "uz" | "ru" | "en"
export const fetchAddress = async (latitude, longitude, lang) => {
  try {
    const address = await fetchNominatimAddress(latitude, longitude, lang);

    if (address) return address;
  } catch (error) {
    console.error(error);
  }

  return fetchBigDataCloudAddress(latitude, longitude, lang);
};
