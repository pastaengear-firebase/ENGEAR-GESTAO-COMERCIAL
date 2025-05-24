
// src/contexts/sales-context.tsx
"use client";
import type React from 'react';
import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { SELLERS, ALL_SELLERS_OPTION, LOCAL_STORAGE_SALES_KEY, AREA_OPTIONS, STATUS_OPTIONS, COMPANY_OPTIONS } from '@/lib/constants';
import type { Sale, Seller, SalesContextType, SalesFilters } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid'; // Import uuid

/**
 * DADOS INICIAIS PARA O VENDEDOR SERGIO.
 * Estes dados serão carregados se o localStorage para 'salesAppData' estiver VAZIO.
 * Se você já usou a aplicação e tem dados salvos, precisará limpar o localStorage
 * (Ferramentas de Desenvolvedor do Navegador > Application > Local Storage > clique com o botão direito em salesAppData > Delete)
 * para que estes dados iniciais sejam carregados.
 */
const exampleSalesForSergio: Sale[] = [
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-01-01",
    company: "CLIMAZONE",
    project: "1558",
    os: "",
    area: "INST. AC",
    clientService: "FEMAX - DIST. ACIOLY - SÓ M.O. INST. SPLITS",
    salesValue: 75000.00,
    status: "EM ANDAMENTO",
    payment: 38250.00,
    createdAt: new Date("2025-01-01").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-01-02",
    company: "ENGEAR",
    project: "1600",
    os: "",
    area: "INST. AC",
    clientService: "USINA GIASA - INST. SPLITÃO",
    salesValue: 82800.00,
    status: "FINALIZADO",
    payment: 82800.00,
    createdAt: new Date("2025-01-02").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-01-02",
    company: "ENGEAR",
    project: "1625",
    os: "90",
    area: "GÁS",
    clientService: "CONNOR ENGENHARIA - A&C - T.E. TANQUE",
    salesValue: 1900.00,
    status: "FINALIZADO",
    payment: 1900.00,
    createdAt: new Date("2025-01-02").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-01-02",
    company: "CLIMAZONE",
    project: "1627",
    os: "27",
    area: "AQG", // Mapeado de AQS
    clientService: "LINK MOTEL - ALPHAVILLE- INST. BOILER",
    salesValue: 3000.00,
    status: "FINALIZADO",
    payment: 3000.00,
    createdAt: new Date("2025-01-02").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-01-02",
    company: "CLIMAZONE",
    project: "1628",
    os: "26",
    area: "MANUT. AC",
    clientService: "HOTEL SLAVIERO (ANDRADE MARINHO LMF)",
    salesValue: 3600.00,
    status: "FINALIZADO",
    payment: 3600.00,
    createdAt: new Date("2025-01-02").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-01-03",
    company: "ENGEAR",
    project: "1632",
    os: "104",
    area: "CI",
    clientService: "MENOR PREÇO - INTERMARES - INST. BOMBA",
    salesValue: 1300.00,
    status: "FINALIZADO",
    payment: 1300.00,
    createdAt: new Date("2025-01-03").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-01-04",
    company: "CLIMAZONE",
    project: "1637",
    os: "29",
    area: "AQG",
    clientService: "DANIEL GALVÃO FORTE - INST. AQ. RINNAI",
    salesValue: 450.00,
    status: "FINALIZADO",
    payment: 450.00,
    createdAt: new Date("2025-01-04").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-01-13",
    company: "ENGEAR",
    project: "1638",
    os: "93",
    area: "INST. AC",
    clientService: "R&M CONSTRUTORA - OBRA JF - TONY",
    salesValue: 32000.00,
    status: "EM ANDAMENTO", // Mapeado de ANDAMENTO
    payment: 0.00, // Pagamento estava em branco
    createdAt: new Date("2025-01-13").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-01-16",
    company: "CLIMAZONE",
    project: "1639",
    os: "",
    area: "INST. AC",
    clientService: "KLEYTON - INST. SPLIT",
    salesValue: 700.00,
    status: "FINALIZADO",
    payment: 700.00,
    createdAt: new Date("2025-01-16").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-01-16",
    company: "CLIMAZONE",
    project: "1640",
    os: "",
    area: "GÁS",
    clientService: "KLEYTON - INST. MEDIDOR E KIT",
    salesValue: 900.00,
    status: "FINALIZADO",
    payment: 900.00,
    createdAt: new Date("2025-01-16").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-01-16",
    company: "CLIMAZONE",
    project: "1641",
    os: "",
    area: "GÁS",
    clientService: "ADR2 - EDF. MARENA - REDE DE GÁS",
    salesValue: 26900.00,
    status: "EM ANDAMENTO",
    payment: 0.00, // Pagamento estava em branco
    createdAt: new Date("2025-01-16").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-01-16",
    company: "CLIMAZONE",
    project: "1642",
    os: "",
    area: "PRÉ",
    clientService: "ADR2 - EDF. MARENA - PRÉ  150 CADA +/- 250 UNID.",
    salesValue: 37500.00,
    status: "EM ANDAMENTO",
    payment: 0.00, // Pagamento estava em branco
    createdAt: new Date("2025-01-16").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-01-16",
    company: "CLIMAZONE",
    project: "1644",
    os: "",
    area: "GÁS",
    clientService: "MENOR PREÇO - ALTIPLANO",
    salesValue: 8000.00,
    status: "EM ANDAMENTO",
    payment: 8000.00,
    createdAt: new Date("2025-01-16").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-01-16",
    company: "CLIMAZONE",
    project: "1645",
    os: "",
    area: "GÁS",
    clientService: "UNIPE - UNIVERSIDADE CRUZ. DO SUL - 2X T.E .",
    salesValue: 2600.00,
    status: "FINALIZADO",
    payment: 2600.00,
    createdAt: new Date("2025-01-16").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-01-16",
    company: "CLIMAZONE",
    project: "1647",
    os: "",
    area: "GÁS",
    clientService: "MEGA ATACAREJO - VALENTINA",
    salesValue: 900.00,
    status: "FINALIZADO",
    payment: 0.00, // Pagamento estava em branco
    createdAt: new Date("2025-01-16").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-01-16",
    company: "ENGEAR",
    project: "1648",
    os: "94",
    area: "MANUT. AC",
    clientService: "IF PARTCIPAÇÕES",
    salesValue: 2550.00,
    status: "FINALIZADO",
    payment: 2550.00,
    createdAt: new Date("2025-01-16").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-01-22",
    company: "CLIMAZONE",
    project: "1649",
    os: "",
    area: "AQG",
    clientService: "PATRICIO LEAL - INST. PRESSURIZADOR",
    salesValue: 250.00,
    status: "FINALIZADO",
    payment: 250.00,
    createdAt: new Date("2025-01-22").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-01-22",
    company: "ENGEAR",
    project: "1655",
    os: "109",
    area: "CI",
    clientService: "HOSP. MEM. S. FRANCISCO - ENG. DIEGO",
    salesValue: 11823.00,
    status: "FINALIZADO",
    payment: 11823.00,
    createdAt: new Date("2025-01-22").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-01-22",
    company: "CLIMAZONE",
    project: "1659",
    os: "43",
    area: "INST. AC",
    clientService: "DATERRA OLIMPICO- SÓ M.O. INST. AC A. COMUNS",
    salesValue: 18000.00,
    status: "EM ANDAMENTO",
    payment: 0.00, // Pagamento estava em branco
    createdAt: new Date("2025-01-22").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-01-29",
    company: "CLIMAZONE",
    project: "1666",
    os: "34",
    area: "SAS",
    clientService: "ODILON J. LINS FALCÃO - SÓ VENDA COLET. SOLAR",
    salesValue: 3590.00,
    status: "FINALIZADO",
    payment: 3590.00,
    createdAt: new Date("2025-01-29").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-01-29",
    company: "CLIMAZONE",
    project: "1670",
    os: "35",
    area: "GÁS",
    clientService: "CLUBE DOS OFICIAIS -  GÁS - ENG. DIEGO",
    salesValue: 1400.00,
    status: "EM ANDAMENTO",
    payment: 0.00, // Pagamento estava em branco
    createdAt: new Date("2025-01-29").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-01-29",
    company: "ENGEAR",
    project: "1671",
    os: "100",
    area: "AQG",
    clientService: "ELLY - DINACIM ENGNHARIA - SÓ VISITA",
    salesValue: 180.00,
    status: "FINALIZADO",
    payment: 0.00, // Pagamento estava em branco
    createdAt: new Date("2025-01-29").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-01-29",
    company: "CLIMAZONE",
    project: "1672",
    os: "36",
    area: "AQG", // Mapeado de AQS
    clientService: "MAIA EMPREENDIMENTOS - ANELISE",
    salesValue: 900.00,
    status: "FINALIZADO",
    payment: 0.00, // Pagamento estava em branco
    createdAt: new Date("2025-01-29").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-02-02",
    company: "CLIMAZONE",
    project: "1674",
    os: "37",
    area: "GÁS",
    clientService: "DELTA - EDF. TAI - SÓ M.O. INST. REDE DE GÁS  - P.G.",
    salesValue: 21000.00,
    status: "EM ANDAMENTO",
    payment: 0.00, // Pagamento estava em branco
    createdAt: new Date("2025-02-02").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-02-02",
    company: "ENGEAR",
    project: "1675",
    os: "101",
    area: "GÁS",
    clientService: "COND. APHAVILLE - REG. REDE DE GÁS 2X",
    salesValue: 1000.00,
    status: "FINALIZADO",
    payment: 1000.00,
    createdAt: new Date("2025-02-02").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-02-02",
    company: "ENGEAR",
    project: "1676",
    os: "38",
    area: "INST. AC",
    clientService: "ID ENGENHARIA - ENG. DIEGO - REG. SPLITS HMSF",
    salesValue: 6290.00,
    status: "Á INICIAR",
    payment: 0.00, // Pagamento estava em branco
    createdAt: new Date("2025-02-02").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-02-02",
    company: "CLIMAZONE",
    project: "1677",
    os: "102",
    area: "GÁS",
    clientService: "ID ENGENHARIA - ENG. DIEGO - REALOC. GÁS",
    salesValue: 7000.00,
    status: "Á INICIAR",
    payment: 0.00, // Pagamento estava em branco
    createdAt: new Date("2025-02-02").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-02-03",
    company: "CLIMAZONE",
    project: "1678",
    os: "39",
    area: "MANUT. AC",
    clientService: "CASA NORTE - NATAL RN - MANUT. AC",
    salesValue: 10000.00,
    status: "FINALIZADO",
    payment: 10000.00,
    createdAt: new Date("2025-02-03").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-02-03",
    company: "CLIMAZONE",
    project: "1679",
    os: "41",
    area: "EXAUST", // Mapeado de EXAUST.
    clientService: "DCT - SINT AC E EXASUTÃO",
    salesValue: 9000.00,
    status: "FINALIZADO",
    payment: 9000.00,
    createdAt: new Date("2025-02-03").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-02-03",
    company: "CLIMAZONE",
    project: "1680",
    os: "40",
    area: "MANUT. AC",
    clientService: "INTERMARES HALL",
    salesValue: 10000.00,
    status: "FINALIZADO",
    payment: 10000.00,
    createdAt: new Date("2025-02-03").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-02-10",
    company: "CLIMAZONE",
    project: "1685",
    os: "",
    area: "CI",
    clientService: "MENOR PREÇO ALTIPLANO - SÓ M.O.",
    salesValue: 24000.00,
    status: "Á INICIAR",
    payment: 24000.00,
    createdAt: new Date("2025-02-10").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-02-11",
    company: "CLIMAZONE",
    project: "1682",
    os: "104",
    area: "CI",
    clientService: "MENOR PREÇO INTERMARES  - SUBST. PRESSOTATO.",
    salesValue: 1500.00,
    status: "FINALIZADO",
    payment: 1500.00,
    createdAt: new Date("2025-02-11").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-02-12",
    company: "ENGEAR",
    project: "1687",
    os: "106",
    area: "MANUT. AC",
    clientService: "MULTI CONTRUÇÕES - MANUT. SPLIT",
    salesValue: 80000.00,
    status: "Á INICIAR",
    payment: 22000.00,
    createdAt: new Date("2025-02-12").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-02-11",
    company: "CLIMAZONE",
    project: "1688",
    os: "105",
    area: "CI",
    clientService: "MEGA ATACAREJO - MUDANÇA NO RECALQUE DE CI",
    salesValue: 1700.00,
    status: "FINALIZADO",
    payment: 1700.00,
    createdAt: new Date("2025-02-11").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-02-12",
    company: "CLIMAZONE",
    project: "1689",
    os: "107",
    area: "AQG", // Mapeado de AQS
    clientService: "TONY E KÉZIA - ALPHAVILLE - SUBST. RESISTENCIA",
    salesValue: 750.00,
    status: "FINALIZADO",
    payment: 750.00,
    createdAt: new Date("2025-02-12").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-02-13",
    company: "CLIMAZONE",
    project: "1690",
    os: "42",
    area: "AQG", // Mapeado de AQS
    clientService: "CAMILA FIGUEIREDO - REVISÃO TERMOSTATO BOILER",
    salesValue: 0.00,
    status: "FINALIZADO",
    payment: 0.00,
    createdAt: new Date("2025-02-13").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-02-13",
    company: "CLIMAZONE",
    project: "1691",
    os: "44",
    area: "INST. AC",
    clientService: "JORGE CRISPIM (SR. ROMERIO)  - ALPHAVILLE - INST K7",
    salesValue: 19000.00,
    status: "FINALIZADO",
    payment: 19000.00,
    createdAt: new Date("2025-02-13").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-02-18",
    company: "CLIMAZONE",
    project: "1695",
    os: "46",
    area: "INST. AC",
    clientService: "ARCO CONST. FORN. E INST. AC CORAIS DE A. DOURADA",
    salesValue: 75000.00,
    status: "EM ANDAMENTO",
    payment: 0.00, // Pagamento estava em branco
    createdAt: new Date("2025-02-18").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-02-19",
    company: "CLIMAZONE",
    project: "1696",
    os: "45",
    area: "MANUT. AC",
    clientService: "DR. OSMINDO ALPHAVILLE",
    salesValue: 2600.00,
    status: "FINALIZADO",
    payment: 2600.00,
    createdAt: new Date("2025-02-19").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-02-24",
    company: "CLIMAZONE",
    project: "1698",
    os: "",
    area: "INST. AC",
    clientService: "VEXA ACABAMENTOS",
    salesValue: 130000.00,
    status: "EM ANDAMENTO",
    payment: 0.00, // Pagamento estava em branco
    createdAt: new Date("2025-02-24").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-02-26",
    company: "ENGEAR",
    project: "1711",
    os: "111",
    area: "GÁS",
    clientService: "SONHO DOCE  MANAÍRA SHOPPING - T.E. LAUDO E ART.",
    salesValue: 976.00,
    status: "FINALIZADO",
    payment: 976.00,
    createdAt: new Date("2025-02-26").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-02-26",
    company: "ENGEAR",
    project: "1712",
    os: "110",
    area: "GÁS",
    clientService: "KFC - MANAÍRA SHOPPING - T.E. LAUDO E ART.",
    salesValue: 976.00,
    status: "FINALIZADO",
    payment: 976.00,
    createdAt: new Date("2025-02-26").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-02-26",
    company: "CLIMAZONE",
    project: "1713",
    os: "",
    area: "SAS",
    clientService: "SR. MURILO - ALPHAVILLE - DESINSTALAÇÃO COLETORES",
    salesValue: 450.00,
    status: "EM ANDAMENTO",
    payment: 0.00, // Pagamento estava em branco
    createdAt: new Date("2025-02-26").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-02-26",
    company: "CLIMAZONE",
    project: "1714",
    os: "112",
    area: "SAS",
    clientService: "SR. PEDRO VITOR - ALPHAVILLE 3X COLETOR SOLAR",
    salesValue: 5800.00,
    status: "FINALIZADO",
    payment: 5800.00,
    createdAt: new Date("2025-02-26").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-03-12",
    company: "CLIMAZONE",
    project: "1721",
    os: "47",
    area: "INST. AC",
    clientService: "IJAI NÁBREGA - INST. K7 36K",
    salesValue: 2000.00,
    status: "CANCELADO",
    payment: 0.00, // Pagamento estava em branco
    createdAt: new Date("2025-03-12").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-03-17",
    company: "CLIMAZONE",
    project: "1724",
    os: "",
    area: "GÁS",
    clientService: "RANIERE SARAIVA - REDE DE GÁS",
    salesValue: 2600.00,
    status: "Á INICIAR",
    payment: 0.00, // Pagamento estava em branco
    createdAt: new Date("2025-03-17").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-03-17",
    company: "ENGEAR",
    project: "1726",
    os: "",
    area: "GÁS",
    clientService: "COND. ALPHAVILLE - REG. VAZAMENTO",
    salesValue: 1630.00,
    status: "FINALIZADO",
    payment: 1630.00,
    createdAt: new Date("2025-03-17").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-03-18",
    company: "CLIMAZONE",
    project: "1728",
    os: "",
    area: "EXAUST", // Mapeado de EXAUST.
    clientService: "BOSSA DESIGN HOTEL",
    salesValue: 16000.00,
    status: "EM ANDAMENTO",
    payment: 0.00, // Pagamento estava em branco
    createdAt: new Date("2025-03-18").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-03-21",
    company: "ENGEAR",
    project: "1737",
    os: "",
    area: "GÁS",
    clientService: "WANESSA ARRUDA - INST. AQ., KIT E CONVERSÃO",
    salesValue: 900.00,
    status: "FINALIZADO",
    payment: 900.00,
    createdAt: new Date("2025-03-21").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-03-27",
    company: "ENGEAR",
    project: "1766",
    os: "132",
    area: "LOCAÇÃO",
    clientService: "ENGIE - LOCAÇÃO SUAPE 4 DIARIAS",
    salesValue: 10000.00,
    status: "FINALIZADO",
    payment: 10000.00,
    createdAt: new Date("2025-03-27").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-04-04",
    company: "CLIMAZONE",
    project: "1757",
    os: "129",
    area: "MANUT. AC",
    clientService: "MAG SHOPPING",
    salesValue: 0.00,
    status: "Á INICIAR",
    payment: 0.00, // Pagamento estava em branco
    createdAt: new Date("2025-04-04").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-04-15",
    company: "ENGEAR",
    project: "1771",
    os: "",
    area: "GÁS",
    clientService: "SONIVALDO - REDE DE GÁS LAVANDERIA ACQUALIS",
    salesValue: 5000.00,
    status: "EM ANDAMENTO",
    payment: 0.00, // Pagamento estava em branco
    createdAt: new Date("2025-04-15").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-04-15",
    company: "ENGEAR",
    project: "1772",
    os: "",
    area: "GÁS",
    clientService: "EDF. LECADRE - CONST. ATRIOS REG.VAZAMENTO - GARANTIA",
    salesValue: 0.00,
    status: "FINALIZADO",
    payment: 0.00,
    createdAt: new Date("2025-04-15").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-04-23",
    company: "CLIMAZONE",
    project: "1774",
    os: "",
    area: "AQG", // Mapeado de AQS
    clientService: "HOTEL ANJOS - SR. MICHAEL",
    salesValue: 4000.00,
    status: "Á INICIAR",
    payment: 0.00, // Pagamento estava em branco
    createdAt: new Date("2025-04-23").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-04-25",
    company: "CLIMAZONE",
    project: "1800",
    os: "",
    area: "AQG", // Mapeado de AQS
    clientService: "DR. BERILO PAI - SUBT.  PRESSURIZADORCONTROLADOR",
    salesValue: 0.00, // Valor estava em branco
    status: "FINALIZADO",
    payment: 0.00, // Pagamento estava em branco
    createdAt: new Date("2025-04-25").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-05-05",
    company: "CLIMAZONE",
    project: "1803",
    os: "63",
    area: "AQG", // Mapeado de AQS
    clientService: "SR. ARAKEN - SUBST. COLETOR SOLAR",
    salesValue: 2707.00,
    status: "FINALIZADO",
    payment: 2707.00,
    createdAt: new Date("2025-05-05").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-05-07",
    company: "CLIMAZONE",
    project: "1804",
    os: "64",
    area: "INST. AC",
    clientService: "BENEDITO - INST. VRF SAMSUNG",
    salesValue: 13000.00,
    status: "Á INICIAR",
    payment: 0.00, // Pagamento estava em branco
    createdAt: new Date("2025-05-07").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-05-07",
    company: "CLIMAZONE",
    project: "1805",
    os: "138",
    area: "GÁS",
    clientService: "MENOR PREÇO - ADICIONAIS GÁS E CI",
    salesValue: 3215.00,
    status: "FINALIZADO",
    payment: 3215.00,
    createdAt: new Date("2025-05-07").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-05-12",
    company: "CLIMAZONE",
    project: "1813",
    os: "",
    area: "GÁS",
    clientService: "TYH",
    salesValue: 350.00,
    status: "FINALIZADO",
    payment: 350.00,
    createdAt: new Date("2025-05-12").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-05-13",
    company: "CLIMAZONE",
    project: "1814",
    os: "",
    area: "GÁS",
    clientService: "MM ENGENHARIA - INST. REGISTROS BLOQUEIO",
    salesValue: 1900.00,
    status: "FINALIZADO",
    payment: 1900.00,
    createdAt: new Date("2025-05-13").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-05-21",
    company: "CLIMAZONE",
    project: "1822",
    os: "",
    area: "AQG", // Mapeado de AQS
    clientService: "DR. REGIS BONFIM - ALPHAVILE SÓ INSTALAÇÃO",
    salesValue: 390.00,
    status: "FINALIZADO",
    payment: 0.00, // Pagamento estava em branco
    createdAt: new Date("2025-05-21").getTime(),
  },
  {
    id: uuidv4(),
    seller: "SERGIO",
    date: "2025-05-21",
    company: "CLIMAZONE",
    project: "1823",
    os: "",
    area: "EXAUST", // Mapeado de EXAUST.
    clientService: "WL MARCOLINO - INST. DUTOS COIFAS E VENTILADORES",
    salesValue: 10000.00,
    status: "Á INICIAR",
    payment: 0.00, // Pagamento estava em branco
    createdAt: new Date("2025-05-21").getTime(),
  },
];


export const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSeller, setSelectedSellerState] = useState<Seller | typeof ALL_SELLERS_OPTION>(ALL_SELLERS_OPTION);
  const [filters, setFiltersState] = useState<SalesFilters>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let initialData: Sale[] = [];
    try {
      const storedSales = localStorage.getItem(LOCAL_STORAGE_SALES_KEY);
      if (storedSales) {
        initialData = JSON.parse(storedSales);
      } else {
        // Se não há nada no localStorage, use os dados iniciais de exemplo para SERGIO
        initialData = exampleSalesForSergio; 
        localStorage.setItem(LOCAL_STORAGE_SALES_KEY, JSON.stringify(initialData));
      }
    } catch (error) {
      console.error("Failed to load sales data from localStorage or use initial data", error);
      localStorage.removeItem(LOCAL_STORAGE_SALES_KEY);
      initialData = exampleSalesForSergio;
      try {
        localStorage.setItem(LOCAL_STORAGE_SALES_KEY, JSON.stringify(initialData));
      } catch (saveError) {
        console.error("Failed to save initial data to localStorage after error", saveError);
      }
    }
    setSales(initialData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) { 
      localStorage.setItem(LOCAL_STORAGE_SALES_KEY, JSON.stringify(sales));
    }
  }, [sales, loading]);

  const addSale = useCallback((saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>): Sale => {
    const newSale: Sale = {
      ...saleData,
      id: uuidv4(),
      createdAt: Date.now(),
    };
    setSales(prevSales => [...prevSales, newSale].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    return newSale;
  }, []);

  const updateSale = useCallback((id: string, saleUpdateData: Partial<Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>>): Sale | undefined => {
    let updatedSale: Sale | undefined;
    setSales(prevSales =>
      prevSales.map(sale => {
        if (sale.id === id) {
          const currentSeller = sale.seller; // Preserve original seller unless explicitly changed
          updatedSale = {
            ...sale,
            ...saleUpdateData,
            seller: saleUpdateData.seller || currentSeller, // Ensure seller is preserved
            updatedAt: Date.now()
          };
          return updatedSale;
        }
        return sale;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
    return updatedSale;
  }, []);

  const deleteSale = useCallback((id: string) => {
    setSales(prevSales => prevSales.filter(sale => sale.id !== id));
  }, []);

  const getSaleById = useCallback((id: string): Sale | undefined => {
    return sales.find(sale => sale.id === id);
  }, [sales]);

  const setSelectedSeller = useCallback((seller: Seller | typeof ALL_SELLERS_OPTION) => {
    setSelectedSellerState(seller);
  }, []);

  const setFilters = useCallback((newFilters: SalesFilters) => {
    setFiltersState(prevFilters => ({ ...prevFilters, ...newFilters }));
  }, []);

  const filteredSales = useMemo(() => {
    return sales
      .filter(sale => {
        if (selectedSeller === ALL_SELLERS_OPTION) return true;
        return sale.seller === selectedSeller;
      })
      .filter(sale => {
        if (!filters.searchTerm) return true;
        const term = filters.searchTerm.toLowerCase();
        return (
          sale.company.toLowerCase().includes(term) ||
          sale.project.toLowerCase().includes(term) ||
          sale.os.toLowerCase().includes(term) ||
          sale.clientService.toLowerCase().includes(term)
        );
      })
      .filter(sale => {
        if (!filters.startDate) return true;
        const saleDate = new Date(sale.date);
        // Ajuste para considerar o dia inteiro, ignorando a hora para comparação de data
        saleDate.setUTCHours(0,0,0,0);
        const filterStartDate = new Date(filters.startDate);
        filterStartDate.setUTCHours(0,0,0,0);
        return saleDate >= filterStartDate;
      })
      .filter(sale => {
        if (!filters.endDate) return true;
        const saleDate = new Date(sale.date);
        saleDate.setUTCHours(0,0,0,0); // Ajuste similar
        const filterEndDate = new Date(filters.endDate);
        filterEndDate.setUTCHours(23,59,59,999); // Ajuste para incluir o dia final inteiro
        return saleDate <= filterEndDate;
      });
  }, [sales, selectedSeller, filters]);

  return (
    <SalesContext.Provider
      value={{
        sales,
        filteredSales,
        selectedSeller,
        setSelectedSeller,
        addSale,
        updateSale,
        deleteSale,
        getSaleById,
        setFilters,
        filters,
        loading
      }}
    >
      {children}
    </SalesContext.Provider>
  );
};
