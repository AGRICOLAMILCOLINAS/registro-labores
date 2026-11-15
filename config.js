/* =====================================================================
   CONFIGURACIÓN — aquí se subdivide por finca.
   Lo que dice (ejemplo) se reemplaza con los datos reales.
   meta = rendimiento esperado POR HORA efectiva (null = sin meta aún).
   ===================================================================== */
const CONFIG = {
  EMPRESA: "Mil Colinas",
  SYNC_URL: "https://script.google.com/macros/s/AKfycby6JICrtMzh_gQgNVcHPXUUrjmmc9Ep7YnAOSMenMWOVeaTtD5YKAmWGgbCs0C8D__J/exec",
  UNIDADES: ["árboles","plantas","kg","g","bultos","canastillas","m²","ha","metros","hoyos","puntos","litros","bombadas","tanques","camas","trampas","viajes"],
  CLAVE_SUPERVISOR: "1234",   // clave para ver Registros y Rendimientos (cambiarla)   // dirección del Apps Script de la Google Sheet

  LABORES: {
    "Aguacate Hass": [
      {c:"H01", n:"Herbicida en plateo",                                   u:"árboles", meta:null},
      {c:"H02", n:"Herbicida por surco",                                   u:"árboles", meta:null},
      {c:"H03", n:"Herbicida en área completa",                            u:"m²",      meta:null},
      {c:"H04", n:"Deshierba manual de platos",                            u:"árboles", meta:null},
      {c:"H05", n:"Guadaña por parejo",                                    u:"árboles", meta:null},
      {c:"H06", n:"Guadaña en bandas",                                     u:"árboles", meta:null},
      {c:"H07", n:"Guadaña de vías, bordes y zonas comunes",               u:"metros",  meta:null},
      {c:"H08", n:"Fertilización granulada",                               u:"árboles", meta:null},
      {c:"H09", n:"Enmiendas (cal)",                                       u:"árboles", meta:null},
      {c:"H10", n:"Materia orgánica",                                      u:"árboles", meta:null},
      {c:"H11", n:"Mulch",                                                 u:"árboles", meta:null},
      {c:"H12", n:"Despunte",                                              u:"árboles", meta:null},
      {c:"H13", n:"Poda (realce, abrir centro, altura, sanitaria)",        u:"árboles", meta:null},
      {c:"H14", n:"Poda sencilla (una rama)",                              u:"árboles", meta:null},
      {c:"H15", n:"Sellado y cicatrización",                               u:"árboles", meta:null},
      {c:"H16", n:"Monitoreo de plagas y enfermedades",                    u:"árboles", meta:null},
      {c:"H17", n:"Tanqueo de dron",                                       u:"ha",      meta:null},
      {c:"H18", n:"Aspersión / fumigación con estacionaria",               u:"árboles", meta:null},
      {c:"H19", n:"Cosecha",                                               u:"canastillas", meta:null},
      {c:"H20", n:"Cargue y descargue de canastillas o fruta",             u:"canastillas", meta:null},
      {c:"H21", n:"Ahoyado",                                               u:"hoyos",   meta:null},
      {c:"H22", n:"Mecanización por punto",                                u:"puntos",  meta:null},
      {c:"H23", n:"Siembra",                                               u:"árboles", meta:null},
      {c:"H24", n:"Mantenimiento de vías (cunetas, embalastrado, zanjas)", u:"metros",  meta:null},
      {c:"H25", n:"Mantenimiento de drenajes",                             u:"metros",  meta:null},
      {c:"H26", n:"Infraestructura",                                       u:"",   meta:null},
      {c:"H99", n:"Otra (describir en observaciones)",                     u:"",   meta:null}
    ],
    "Arándano": [
      {c:"A011", n:"Poda de mesa",                                    u:"plantas", meta:null},
      {c:"A012", n:"Poda de formación",                               u:"plantas", meta:null},
      {c:"A013", n:"Despunte / pinzado",                              u:"plantas", meta:null},
      {c:"A021", n:"Cosecha",                                      u:"kg",      meta:null},
      {c:"A022", n:"Selección y empaque",                          u:"kg",      meta:null},
      {c:"A031", n:"Deshierba de camas",                          u:"metros de cama", meta:null},
      {c:"A032", n:"Guadaña / limpieza de calles",                u:"m²",      meta:null},
      {c:"A041", n:"Aplicación fitosanitaria",                     u:"plantas", meta:null},
      {c:"A042", n:"Monitoreo de plagas y enfermedades",           u:"plantas", meta:null},
      {c:"A051", n:"Tutorado / amarre",                            u:"plantas", meta:null},
      {c:"A052", n:"Aplicación de sustrato / cascarilla",          u:"plantas", meta:null},
      {c:"A053", n:"Revisión y limpieza de goteros",               u:"camas",   meta:null},
      {c:"A99", n:"Otra (describir en observaciones)",                u:"",   meta:null}
    ]
  },

  FINCAS: [
    {nombre:"La Morelia",     cultivo:"Aguacate Hass", operarios:["Alberto","Francisco"]},
    {nombre:"Huerto Palermo", cultivo:"Aguacate Hass", operarios:["Jesús"]},
    {nombre:"El Porvenir",    cultivo:"Aguacate Hass", operarios:["Jorge","Alexis"]},
    {nombre:"San Luis",       cultivo:"Aguacate Hass", operarios:["Yeison","Don Albeiro"]},
    {nombre:"Paltacs",        cultivo:"Aguacate Hass", operarios:["John","Alejandro","Marta"]}
  ]
};
/* ===================================================================== */

