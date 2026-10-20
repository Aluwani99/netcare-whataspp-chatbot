// Netcare hospitals. Addresses: Netcare's own "Find a pharmacy" hospital list (netcare.co.za, 2026).
// Phone numbers: ONLY included where several independent sources agreed. Where `tel` is empty the bot
// tells users to find the number on www.netcare.co.za. Customer-care emails come from a published
// hospital directory. → Have Netcare confirm/complete every number before going live.
//   [id, name, province, area(Gauteng only), suburb, address, tel, customerCareEmail, shortName]

export const PROVINCES = [
  { id: 'gp', name: 'Gauteng' },
  { id: 'wc', name: 'Western Cape' },
  { id: 'kzn', name: 'KwaZulu-Natal' },
  { id: 'ec', name: 'Eastern Cape' },
  { id: 'fs', name: 'Free State' },
  { id: 'lp', name: 'Limpopo' },
  { id: 'nw', name: 'North West' },
];
export const GP_AREAS = [
  { id: 'jhb', name: 'Johannesburg & Sandton' },
  { id: 'pta', name: 'Pretoria & Centurion' },
  { id: 'rand', name: 'East & West Rand' },
];

const RAW = [
  // Gauteng – Johannesburg & Sandton
  ['garden-city', 'Netcare Garden City Hospital', 'gp', 'jhb', 'Mayfair West', '35 Bartlett Road, Mayfair West, 2092', '011 495 5000'],
  ['linksfield', 'Netcare Linksfield Hospital', 'gp', 'jhb', 'Linksfield West', '24 12th Avenue, Linksfield West, 2192', '011 647 3400', 'customercarelinksfield@netcare.co.za'],
  ['milpark', 'Netcare Milpark Hospital', 'gp', 'jhb', 'Parktown West', '9 Guild Road, Parktown West, 2193', '011 480 5600'],
  ['mulbarton', 'Netcare Mulbarton Hospital', 'gp', 'jhb', 'Mulbarton', '25 True North Road, Mulbarton, 2059'],
  ['olivedale', 'Netcare Olivedale Hospital', 'gp', 'jhb', 'Randburg', 'Cnr President Fouche & Windsor Way, Randburg, 2125'],
  ['park-lane', 'Netcare Park Lane Hospital', 'gp', 'jhb', 'Parktown', 'Cnr Junction Avenue & Park Lane, Parktown, 2193', '011 480 4000'],
  ['rand', 'Netcare Rand Hospital', 'gp', 'jhb', 'Berea', '33 Bruce Street, Berea, 2198', '011 644 2700'],
  ['rosebank', 'Netcare Rosebank Hospital', 'gp', 'jhb', 'Rosebank', '14 Sturdee Avenue, Rosebank, 2132', '011 328 0500', 'customercarerosebank@netcare.co.za'],
  ['sunninghill', 'Netcare Sunninghill Hospital', 'gp', 'jhb', 'Sunninghill, Sandton', 'Cnr Witkoppen & Nanyuki Roads, Sunninghill, 2196', '011 806 1500'],
  ['waterfall-city', 'Netcare Waterfall City Hospital', 'gp', 'jhb', 'Midrand', 'Cnr Magwa Crescent & Mac Mac Avenue, Midrand, 1682'],
  // Gauteng – Pretoria & Centurion
  ['akasia', 'Netcare Akasia Hospital', 'gp', 'pta', 'Akasia', 'Cnr Heinrich & Brits Avenue, Karen Park Ext. 25, Akasia, 0118'],
  ['bougainville', 'Netcare Bougainville Hospital', 'gp', 'pta', 'Daspoort', 'Cnr Jennings & Redelinghuys Streets, Daspoort, 0030'],
  ['femina', 'Netcare Femina Hospital', 'gp', 'pta', 'Arcadia', '460 Belvedere Street, Arcadia, 0007'],
  ['jakaranda', 'Netcare Jakaranda Hospital', 'gp', 'pta', 'Muckleneuk', '213 Middelberg Street, Muckleneuk, 0132'],
  ['montana', 'Netcare Montana Hospital', 'gp', 'pta', 'Montana Park', 'Cnr Dr Swanepoel & Rooibos Streets, Montana Park, Pretoria, 0159'],
  ['moot', 'Netcare Moot Hospital', 'gp', 'pta', 'Rietfontein', '572 18th Avenue, Rietfontein, 0084'],
  ['pretoria-east', 'Netcare Pretoria East Hospital', 'gp', 'pta', 'Moreleta Park', 'Cnr Garsfontein & Netcare Roads, Moreleta Park, 0181'],
  ['unitas', 'Netcare Unitas Hospital', 'gp', 'pta', 'Lyttelton, Centurion', 'Clifton Avenue, Lyttelton, Centurion, 0140', '012 677 8000', 'customercareunitas@netcare.co.za'],
  // Gauteng – East & West Rand
  ['alberton', 'Netcare Alberton Hospital', 'gp', 'rand', 'Alberton', '1 Netcare Avenue, Newmarket Precinct, Alberton, 1450'],
  ['krugersdorp', 'Netcare Krugersdorp Hospital', 'gp', 'rand', 'Krugersdorp', '9 Burger Street, Krugersdorp, 1739'],
  ['linmed', 'Netcare Linmed Hospital', 'gp', 'rand', 'Benoni', '5 Hull Road, Rynfield, Benoni, 1501'],
  ['n17', 'Netcare N17 Hospital', 'gp', 'rand', 'Springs', '7 Tonk Meter Road, Pollak Park Ext. 7, Springs, 1559'],
  ['pinehaven', 'Netcare Pinehaven Hospital', 'gp', 'rand', 'Krugersdorp', '1 Gateway Road, Pinehaven Estates, Krugersdorp, 1739'],
  ['sunward-park', 'Netcare Sunward Park Hospital', 'gp', 'rand', 'Boksburg', 'Cnr Kingfisher Avenue, Aquarius Road & Bert Lacey Drive, Sunward Park, Boksburg, 1459'],
  // Western Cape
  ['blaauwberg', 'Netcare Blaauwberg Hospital', 'wc', '', 'Sunningdale', 'Waterville Crescent, Sunningdale, 7441'],
  ['christiaan-barnard', 'Netcare Christiaan Barnard Memorial Hospital', 'wc', '', 'Cape Town CBD', '181 Longmarket Street, Cape Town, 8001', '', 'customercarechristianmemorial@netcare.co.za', 'Christiaan Barnard'],
  ['kuils-river', 'Netcare Kuils River Hospital', 'wc', '', 'Kuils River', '33 Van Riebeeck Road, Kuils River, 7580'],
  ['n1-city', 'Netcare N1 City Hospital', 'wc', '', 'Goodwood', 'Louwtjie Rothman Street, Goodwood, 7460'],
  ['uct-private', 'UCT Private Academic Hospital', 'wc', '', 'Observatory', 'Anzio Road, Observatory, Cape Town, 7925', '', '', 'UCT Private Academic'],
  // KwaZulu-Natal
  ['alberlito', 'Netcare Alberlito Hospital', 'kzn', '', 'Ballito', 'Kirsty Close, Ballito, 4420'],
  ['kingsway', 'Netcare Kingsway Hospital', 'kzn', '', 'Amanzimtoti', '607 Andrew Zondo Road, Amanzimtoti, 4126'],
  ['kokstad', 'Kokstad Private Hospital', 'kzn', '', 'Kokstad', '51 Barker Street, Kokstad, 4700', '', '', 'Kokstad Private'],
  ['margate', 'Netcare Margate Hospital', 'kzn', '', 'Margate', '24 Wartski Drive, Margate, 4275'],
  ['parklands', 'Netcare Parklands Hospital', 'kzn', '', 'Overport, Durban', '75 Hopelands Road, Overport, 4001'],
  ['st-annes', 'Netcare St Anne’s Hospital', 'kzn', '', 'Pietermaritzburg', '331 Burger Street, Pietermaritzburg, 3201'],
  ['st-augustines', 'Netcare St Augustine’s Hospital', 'kzn', '', 'Durban', '107 JB Marks Road, Durban, 4001'],
  ['the-bay', 'Netcare The Bay Hospital', 'kzn', '', 'Richards Bay', 'Kruger Rand Road, CBD, Richards Bay, 3900'],
  ['umhlanga', 'Netcare uMhlanga Hospital', 'kzn', '', 'uMhlanga', '323 uMhlanga Rocks Drive, uMhlanga, 4320', '031 560 5500', 'customercareumhlanga@netcare.co.za'],
  // Eastern Cape
  ['cuyler', 'Netcare Cuyler Hospital', 'ec', '', 'Uitenhage', '34 Cuyler Street, Uitenhage, 6229'],
  ['greenacres', 'Netcare Greenacres Hospital', 'ec', '', 'Port Elizabeth', 'Cnr Cape & Rochelle Roads, Greenacres, Port Elizabeth, 6045'],
  // Free State
  ['kroon', 'Netcare Kroon Hospital', 'fs', '', 'Kroonstad', 'Noordweg, Kroonstad, 9499'],
  ['vaalpark', 'Netcare Vaalpark Hospital', 'fs', '', 'Vaalpark', '40 Karas Avenue, Vaalpark, 1948'],
  ['pelonomi', 'Pelonomi Private Hospital', 'fs', '', 'Bloemfontein', '121 Dr Belcher Road, Heidedal, Bloemfontein, 9301', '', '', 'Pelonomi Private'],
  ['universitas', 'Universitas Private Hospital', 'fs', '', 'Bloemfontein', '1 Logeman Street, Universitas, Bloemfontein, 9301', '', '', 'Universitas Private'],
  // Limpopo / North West
  ['pholoso', 'Netcare Pholoso Hospital', 'lp', '', 'Polokwane', 'Cnr Grobler Street & Eland Avenue, Savannah, Polokwane, 0699'],
  ['ferncrest', 'Netcare Ferncrest Hospital', 'nw', '', 'Tlhabane', 'Moumo Street, Tlhabane, 0309'],
];

export const HOSPITALS = RAW.map(([id, name, province, area, suburb, address, tel = '', email = '', short]) => ({
  id, name, province, area, suburb, address, tel, email, short: short || name.replace(/^Netcare /, '').replace(/ Hospital$/, ''),
}));

export const getHospital = (id) => HOSPITALS.find((h) => h.id === id);
export const hospitalsIn = ({ province, area }) =>
  HOSPITALS.filter((h) => h.province === province && (!area || h.area === area));
export const countIn = (province) => HOSPITALS.filter((h) => h.province === province).length;

export const mapsUrl = (h) =>
  'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${h.name}, ${h.address}`);
