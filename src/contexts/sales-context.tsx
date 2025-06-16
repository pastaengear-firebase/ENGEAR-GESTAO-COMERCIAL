
// src/contexts/sales-context.tsx
"use client";
import type React from 'react';
import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { SELLERS, ALL_SELLERS_OPTION, LOCAL_STORAGE_SALES_KEY, AREA_OPTIONS, STATUS_OPTIONS, COMPANY_OPTIONS, LOCAL_STORAGE_SELECTED_SELLER_KEY } from '@/lib/constants';
import type { Sale, Seller, SalesContextType, SalesFilters } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid'; // Import uuid

/**
 * DADOS INICIAIS PARA O VENDEDOR SERGIO.
 * Estes dados foram processados a partir do CSV fornecido pelo usuário.
 * Para que estes dados sejam carregados, o localStorage (chave 'salesAppData') deve estar VAZIO.
 */
const exampleSalesForSergio: Sale[] = [
  { id: "f47ac10b-58cc-4372-a567-0e02b2c3d479", seller: "SERGIO", date: "2025-01-01", company: "CLIMAZONE", project: "1558", os: "", area: "INST. AC", clientService: "FEMAX - DIST. ACIOLY - SÓ M.O. INST. SPLITS", salesValue: 75000, status: "EM ANDAMENTO", payment: 38250, createdAt: new Date("2025-01-01T00:00:00.000Z").getTime() },
  { id: "9c3b1a8d-78cf-4f5d-9f1a-1b7a9b3c5e2f", seller: "SERGIO", date: "2025-01-02", company: "ENGEAR", project: "1600", os: "", area: "INST. AC", clientService: "USINA GIASA - INST. SPLITÃO", salesValue: 82800, status: "FINALIZADO", payment: 82800, createdAt: new Date("2025-01-02T00:00:00.000Z").getTime() },
  { id: "2e7d8c1b-9a0f-4e2c-8b7d-6f3a5c9b1e8a", seller: "SERGIO", date: "2025-01-02", company: "ENGEAR", project: "1625", os: "90", area: "GÁS", clientService: "CONNOR ENGENHARIA - A&C - T.E. TANQUE", salesValue: 1900, status: "FINALIZADO", payment: 1900, createdAt: new Date("2025-01-02T00:00:00.000Z").getTime() },
  { id: "a0b3d5e7-1c8f-4a9b-8d2e-7f1a3c5b9e2d", seller: "SERGIO", date: "2025-01-02", company: "CLIMAZONE", project: "1627", os: "27", area: "AQG", clientService: "LINK MOTEL - ALPHAVILLE- INST. BOILER", salesValue: 3000, status: "FINALIZADO", payment: 3000, createdAt: new Date("2025-01-02T00:00:00.000Z").getTime() },
  { id: "c5e8f2a1-3b9d-4c7e-af0b-1d8a5c3b7e9f", seller: "SERGIO", date: "2025-01-02", company: "CLIMAZONE", project: "1628", os: "26", area: "MANUT. AC", clientService: "HOTEL SLAVIERO (ANDRADE MARINHO LMF)", salesValue: 3600, status: "FINALIZADO", payment: 3600, createdAt: new Date("2025-01-02T00:00:00.000Z").getTime() },
  { id: "f9a1e3c5-7b2d-4e8f-a0c1-3d5b7e9f2a1c", seller: "SERGIO", date: "2025-01-03", company: "ENGEAR", project: "1632", os: "104", area: "CI", clientService: "MENOR PREÇO - INTERMARES - INST. BOMBA", salesValue: 1300, status: "FINALIZADO", payment: 1300, createdAt: new Date("2025-01-03T00:00:00.000Z").getTime() },
  { id: "b7d2e9f1-a3c5-4b8e-9f0a-1c5b7e3d9f2a", seller: "SERGIO", date: "2025-01-04", company: "CLIMAZONE", project: "1637", os: "29", area: "AQG", clientService: "DANIEL GALVÃO FORTE - INST. AQ. RINNAI", salesValue: 450, status: "FINALIZADO", payment: 450, createdAt: new Date("2025-01-04T00:00:00.000Z").getTime() },
  { id: "e9f1a3c5-b7d2-4e8f-a0c1-3d5b7e9f2a1b", seller: "SERGIO", date: "2025-01-13", company: "ENGEAR", project: "1638", os: "93", area: "INST. AC", clientService: "R&M CONSTRUTORA - OBRA JF - TONY", salesValue: 32000, status: "EM ANDAMENTO", payment: 0, createdAt: new Date("2025-01-13T00:00:00.000Z").getTime() },
  { id: "a3c5b7d2-e9f1-4b8e-9f0a-1c5b7e3d9f2b", seller: "SERGIO", date: "2025-01-16", company: "CLIMAZONE", project: "1639", os: "", area: "INST. AC", clientService: "KLEYTON - INST. SPLIT", salesValue: 700, status: "FINALIZADO", payment: 700, createdAt: new Date("2025-01-16T00:00:00.000Z").getTime() },
  { id: "c5b7e3d9-f2a1-4e8f-a0c1-3d5b7e9f2a1c", seller: "SERGIO", date: "2025-01-16", company: "CLIMAZONE", project: "1640", os: "", area: "GÁS", clientService: "KLEYTON - INST. MEDIDOR E KIT", salesValue: 900, status: "FINALIZADO", payment: 900, createdAt: new Date("2025-01-16T00:00:00.000Z").getTime() },
  { id: "d9f2a1c5-b7e3-4b8e-9f0a-1c5b7e3d9f2c", seller: "SERGIO", date: "2025-01-16", company: "CLIMAZONE", project: "1641", os: "", area: "GÁS", clientService: "ADR2 - EDF. MARENA - REDE DE GÁS", salesValue: 26900, status: "EM ANDAMENTO", payment: 0, createdAt: new Date("2025-01-16T00:00:00.000Z").getTime() },
  { id: "b7e3d9f2-a1c5-4e8f-a0c1-3d5b7e9f2a1d", seller: "SERGIO", date: "2025-01-16", company: "CLIMAZONE", project: "1642", os: "", area: "PRÉ", clientService: "ADR2 - EDF. MARENA - PRÉ  150 CADA +/- 250 UNID.", salesValue: 37500, status: "EM ANDAMENTO", payment: 0, createdAt: new Date("2025-01-16T00:00:00.000Z").getTime() },
  { id: "a1c5b7e3-d9f2-4b8e-9f0a-1c5b7e3d9f2d", seller: "SERGIO", date: "2025-01-16", company: "CLIMAZONE", project: "1644", os: "", area: "GÁS", clientService: "MENOR PREÇO - ALTIPLANO", salesValue: 8000, status: "EM ANDAMENTO", payment: 8000, createdAt: new Date("2025-01-16T00:00:00.000Z").getTime() },
  { id: "e3d9f2a1-c5b7-4e8f-a0c1-3d5b7e9f2a1e", seller: "SERGIO", date: "2025-01-16", company: "CLIMAZONE", project: "1645", os: "", area: "GÁS", clientService: "UNIPE - UNIVERSIDADE CRUZ. DO SUL - 2X T.E .", salesValue: 2600, status: "FINALIZADO", payment: 2600, createdAt: new Date("2025-01-16T00:00:00.000Z").getTime() },
  { id: "c5b7e3d9-f2a1-4e8f-a0c1-3d5b7e9f2a1f", seller: "SERGIO", date: "2025-01-16", company: "CLIMAZONE", project: "1647", os: "", area: "GÁS", clientService: "MEGA ATACAREJO - VALENTINA", salesValue: 900, status: "FINALIZADO", payment: 0, createdAt: new Date("2025-01-16T00:00:00.000Z").getTime() },
  { id: "d9f2a1c5-b7e3-4b8e-9f0a-1c5b7e3d9f2e", seller: "SERGIO", date: "2025-01-16", company: "ENGEAR", project: "1648", os: "94", area: "MANUT. AC", clientService: "IF PARTCIPAÇÕES", salesValue: 2550, status: "FINALIZADO", payment: 2550, createdAt: new Date("2025-01-16T00:00:00.000Z").getTime() },
  { id: "b7e3d9f2-a1c5-4e8f-a0c1-3d5b7e9f2a20", seller: "SERGIO", date: "2025-01-22", company: "CLIMAZONE", project: "1649", os: "", area: "AQG", clientService: "PATRICIO LEAL - INST. PRESSURIZADOR", salesValue: 250, status: "FINALIZADO", payment: 250, createdAt: new Date("2025-01-22T00:00:00.000Z").getTime() },
  { id: "a1c5b7e3-d9f2-4b8e-9f0a-1c5b7e3d9f2f", seller: "SERGIO", date: "2025-01-22", company: "ENGEAR", project: "1655", os: "109", area: "CI", clientService: "HOSP. MEM. S. FRANCISCO - ENG. DIEGO", salesValue: 11823, status: "FINALIZADO", payment: 11823, createdAt: new Date("2025-01-22T00:00:00.000Z").getTime() },
  { id: "e3d9f2a1-c5b7-4e8f-a0c1-3d5b7e9f2a21", seller: "SERGIO", date: "2025-01-22", company: "CLIMAZONE", project: "1659", os: "43", area: "INST. AC", clientService: "DATERRA OLIMPICO- SÓ M.O. INST. AC A. COMUNS", salesValue: 18000, status: "EM ANDAMENTO", payment: 0, createdAt: new Date("2025-01-22T00:00:00.000Z").getTime() },
  { id: "c5b7e3d9-f2a1-4e8f-a0c1-3d5b7e9f2a22", seller: "SERGIO", date: "2025-01-29", company: "CLIMAZONE", project: "1666", os: "34", area: "SAS", clientService: "ODILON J. LINS FALCÃO - SÓ VENDA COLET. SOLAR", salesValue: 3590, status: "FINALIZADO", payment: 3590, createdAt: new Date("2025-01-29T00:00:00.000Z").getTime() },
  { id: "d9f2a1c5-b7e3-4b8e-9f0a-1c5b7e3d9f30", seller: "SERGIO", date: "2025-01-29", company: "CLIMAZONE", project: "1670", os: "35", area: "GÁS", clientService: "CLUBE DOS OFICIAIS -  GÁS - ENG. DIEGO", salesValue: 1400, status: "EM ANDAMENTO", payment: 0, createdAt: new Date("2025-01-29T00:00:00.000Z").getTime() },
  { id: "b7e3d9f2-a1c5-4e8f-a0c1-3d5b7e9f2a23", seller: "SERGIO", date: "2025-01-29", company: "ENGEAR", project: "1671", os: "100", area: "AQG", clientService: "ELLY - DINACIM ENGNHARIA - SÓ VISITA", salesValue: 180, status: "FINALIZADO", payment: 0, createdAt: new Date("2025-01-29T00:00:00.000Z").getTime() },
  { id: "a1c5b7e3-d9f2-4b8e-9f0a-1c5b7e3d9f31", seller: "SERGIO", date: "2025-01-29", company: "CLIMAZONE", project: "1672", os: "36", area: "AQG", clientService: "MAIA EMPREENDIMENTOS - ANELISE", salesValue: 900, status: "FINALIZADO", payment: 0, createdAt: new Date("2025-01-29T00:00:00.000Z").getTime() },
  { id: "e3d9f2a1-c5b7-4e8f-a0c1-3d5b7e9f2a24", seller: "SERGIO", date: "2025-02-02", company: "CLIMAZONE", project: "1674", os: "37", area: "GÁS", clientService: "DELTA - EDF. TAI - SÓ M.O. INST. REDE DE GÁS  - P.G.", salesValue: 21000, status: "EM ANDAMENTO", payment: 0, createdAt: new Date("2025-02-02T00:00:00.000Z").getTime() },
  { id: "c5b7e3d9-f2a1-4e8f-a0c1-3d5b7e9f2a25", seller: "SERGIO", date: "2025-02-02", company: "ENGEAR", project: "1675", os: "101", area: "GÁS", clientService: "COND. APHAVILLE - REG. REDE DE GÁS 2X", salesValue: 1000, status: "FINALIZADO", payment: 1000, createdAt: new Date("2025-02-02T00:00:00.000Z").getTime() },
  { id: "d9f2a1c5-b7e3-4b8e-9f0a-1c5b7e3d9f32", seller: "SERGIO", date: "2025-02-02", company: "ENGEAR", project: "1676", os: "38", area: "INST. AC", clientService: "ID ENGENHARIA - ENG. DIEGO - REG. SPLITS HMSF", salesValue: 6290, status: "Á INICAR", payment: 0, createdAt: new Date("2025-02-02T00:00:00.000Z").getTime() },
  { id: "b7e3d9f2-a1c5-4e8f-a0c1-3d5b7e9f2a26", seller: "SERGIO", date: "2025-02-02", company: "CLIMAZONE", project: "1677", os: "102", area: "GÁS", clientService: "ID ENGENHARIA - ENG. DIEGO - REALOC. GÁS", salesValue: 7000, status: "Á INICAR", payment: 0, createdAt: new Date("2025-02-02T00:00:00.000Z").getTime() },
  { id: "a1c5b7e3-d9f2-4b8e-9f0a-1c5b7e3d9f33", seller: "SERGIO", date: "2025-02-03", company: "CLIMAZONE", project: "1678", os: "39", area: "MANUT. AC", clientService: "CASA NORTE - NATAL RN - MANUT. AC", salesValue: 10000, status: "FINALIZADO", payment: 10000, createdAt: new Date("2025-02-03T00:00:00.000Z").getTime() },
  { id: "e3d9f2a1-c5b7-4e8f-a0c1-3d5b7e9f2a27", seller: "SERGIO", date: "2025-02-03", company: "CLIMAZONE", project: "1679", os: "41", area: "EXAUST", clientService: "DCT - SINT AC E EXASUTÃO", salesValue: 9000, status: "FINALIZADO", payment: 9000, createdAt: new Date("2025-02-03T00:00:00.000Z").getTime() },
  { id: "c5b7e3d9-f2a1-4e8f-a0c1-3d5b7e9f2a28", seller: "SERGIO", date: "2025-02-03", company: "CLIMAZONE", project: "1680", os: "40", area: "MANUT. AC", clientService: "INTERMARES HALL", salesValue: 10000, status: "FINALIZADO", payment: 10000, createdAt: new Date("2025-02-03T00:00:00.000Z").getTime() },
  { id: "d9f2a1c5-b7e3-4b8e-9f0a-1c5b7e3d9f34", seller: "SERGIO", date: "2025-02-10", company: "CLIMAZONE", project: "1685", os: "", area: "CI", clientService: "MENOR PREÇO ALTIPLANO - SÓ M.O.", salesValue: 24000, status: "Á INICIAR", payment: 24000, createdAt: new Date("2025-02-10T00:00:00.000Z").getTime() },
  { id: "b7e3d9f2-a1c5-4e8f-a0c1-3d5b7e9f2a29", seller: "SERGIO", date: "2025-02-11", company: "CLIMAZONE", project: "1682", os: "104", area: "CI", clientService: "MENOR PREÇO INTERMARES  - SUBST. PRESSOTATO.", salesValue: 1500, status: "FINALIZADO", payment: 1500, createdAt: new Date("2025-02-11T00:00:00.000Z").getTime() },
  { id: "a1c5b7e3-d9f2-4b8e-9f0a-1c5b7e3d9f35", seller: "SERGIO", date: "2025-02-12", company: "ENGEAR", project: "1687", os: "106", area: "MANUT. AC", clientService: "MULTI CONTRUÇÕES - MANUT. SPLIT", salesValue: 80000, status: "Á INICIAR", payment: 22000, createdAt: new Date("2025-02-12T00:00:00.000Z").getTime() },
  { id: "e3d9f2a1-c5b7-4e8f-a0c1-3d5b7e9f2a2a", seller: "SERGIO", date: "2025-02-11", company: "CLIMAZONE", project: "1688", os: "105", area: "CI", clientService: "MEGA ATACAREJO - MUDANÇA NO RECALQUE DE CI", salesValue: 1700, status: "FINALIZADO", payment: 1700, createdAt: new Date("2025-02-11T00:00:00.000Z").getTime() },
  { id: "c5b7e3d9-f2a1-4e8f-a0c1-3d5b7e9f2a2b", seller: "SERGIO", date: "2025-02-12", company: "CLIMAZONE", project: "1689", os: "107", area: "AQG", clientService: "TONY E KÉZIA - ALPHAVILLE - SUBST. RESISTENCIA", salesValue: 750, status: "FINALIZADO", payment: 750, createdAt: new Date("2025-02-12T00:00:00.000Z").getTime() },
  { id: "d9f2a1c5-b7e3-4b8e-9f0a-1c5b7e3d9f36", seller: "SERGIO", date: "2025-02-13", company: "CLIMAZONE", project: "1690", os: "42", area: "AQG", clientService: "CAMILA FIGUEIREDO - REVISÃO TERMOSTATO BOILER", salesValue: 0, status: "FINALIZADO", payment: 0, createdAt: new Date("2025-02-13T00:00:00.000Z").getTime() },
  { id: "b7e3d9f2-a1c5-4e8f-a0c1-3d5b7e9f2a2c", seller: "SERGIO", date: "2025-02-13", company: "CLIMAZONE", project: "1691", os: "44", area: "INST. AC", clientService: "JORGE CRISPIM (SR. ROMERIO)  - ALPHAVILLE - INST K7", salesValue: 19000, status: "FINALIZADO", payment: 19000, createdAt: new Date("2025-02-13T00:00:00.000Z").getTime() },
  { id: "a1c5b7e3-d9f2-4b8e-9f0a-1c5b7e3d9f37", seller: "SERGIO", date: "2025-02-18", company: "CLIMAZONE", project: "1695", os: "46", area: "INST. AC", clientService: "ARCO CONST. FORN. E INST. AC CORAIS DE A. DOURADA", salesValue: 75000, status: "EM ANDAMENTO", payment: 0, createdAt: new Date("2025-02-18T00:00:00.000Z").getTime() },
  { id: "e3d9f2a1-c5b7-4e8f-a0c1-3d5b7e9f2a2d", seller: "SERGIO", date: "2025-02-19", company: "CLIMAZONE", project: "1696", os: "45", area: "MANUT. AC", clientService: "DR. OSMINDO ALPHAVILLE", salesValue: 2600, status: "FINALIZADO", payment: 2600, createdAt: new Date("2025-02-19T00:00:00.000Z").getTime() },
  { id: "c5b7e3d9-f2a1-4e8f-a0c1-3d5b7e9f2a2e", seller: "SERGIO", date: "2025-02-24", company: "CLIMAZONE", project: "1698", os: "", area: "INST. AC", clientService: "VEXA ACABAMENTOS", salesValue: 130000, status: "EM ANDAMENTO", payment: 0, createdAt: new Date("2025-02-24T00:00:00.000Z").getTime() },
  { id: "d9f2a1c5-b7e3-4b8e-9f0a-1c5b7e3d9f38", seller: "SERGIO", date: "2025-02-26", company: "ENGEAR", project: "1711", os: "111", area: "GÁS", clientService: "SONHO DOCE  MANAÍRA SHOPPING - T.E. LAUDO E ART.", salesValue: 976, status: "FINALIZADO", payment: 976, createdAt: new Date("2025-02-26T00:00:00.000Z").getTime() },
  { id: "b7e3d9f2-a1c5-4e8f-a0c1-3d5b7e9f2a2f", seller: "SERGIO", date: "2025-02-26", company: "ENGEAR", project: "1712", os: "110", area: "GÁS", clientService: "KFC - MANAÍRA SHOPPING - T.E. LAUDO E ART.", salesValue: 976, status: "FINALIZADO", payment: 976, createdAt: new Date("2025-02-26T00:00:00.000Z").getTime() },
  { id: "a1c5b7e3-d9f2-4b8e-9f0a-1c5b7e3d9f39", seller: "SERGIO", date: "2025-02-26", company: "CLIMAZONE", project: "1713", os: "", area: "SAS", clientService: "SR. MURILO - ALPHAVILLE - DESINSTALAÇÃO COLETORES", salesValue: 450, status: "EM ANDAMENTO", payment: 0, createdAt: new Date("2025-02-26T00:00:00.000Z").getTime() },
  { id: "e3d9f2a1-c5b7-4e8f-a0c1-3d5b7e9f2a30", seller: "SERGIO", date: "2025-02-26", company: "CLIMAZONE", project: "1714", os: "112", area: "SAS", clientService: "SR. PEDRO VITOR - ALPHAVILLE 3X COLETOR SOLAR", salesValue: 5800, status: "FINALIZADO", payment: 5800, createdAt: new Date("2025-02-26T00:00:00.000Z").getTime() },
  { id: "c5b7e3d9-f2a1-4e8f-a0c1-3d5b7e9f2a31", seller: "SERGIO", date: "2025-03-12", company: "CLIMAZONE", project: "1721", os: "47", area: "INST. AC", clientService: "IJAI NÁBREGA - INST. K7 36K", salesValue: 2000, status: "CANCELADO", payment: 0, createdAt: new Date("2025-03-12T00:00:00.000Z").getTime() },
  { id: "d9f2a1c5-b7e3-4b8e-9f0a-1c5b7e3d9f3a", seller: "SERGIO", date: "2025-03-17", company: "CLIMAZONE", project: "1724", os: "", area: "GÁS", clientService: "RANIERE SARAIVA - REDE DE GÁS", salesValue: 2600, status: "Á INICAR", payment: 0, createdAt: new Date("2025-03-17T00:00:00.000Z").getTime() },
  { id: "b7e3d9f2-a1c5-4e8f-a0c1-3d5b7e9f2a32", seller: "SERGIO", date: "2025-03-17", company: "ENGEAR", project: "1726", os: "", area: "GÁS", clientService: "COND. ALPHAVILLE - REG. VAZAMENTO", salesValue: 1630, status: "FINALIZADO", payment: 1630, createdAt: new Date("2025-03-17T00:00:00.000Z").getTime() },
  { id: "a1c5b7e3-d9f2-4b8e-9f0a-1c5b7e3d9f3b", seller: "SERGIO", date: "2025-03-18", company: "CLIMAZONE", project: "1728", os: "", area: "EXAUST", clientService: "BOSSA DESIGN HOTEL", salesValue: 16000, status: "EM ANDAMENTO", payment: 0, createdAt: new Date("2025-03-18T00:00:00.000Z").getTime() },
  { id: "e3d9f2a1-c5b7-4e8f-a0c1-3d5b7e9f2a33", seller: "SERGIO", date: "2025-03-21", company: "ENGEAR", project: "1737", os: "", area: "GÁS", clientService: "WANESSA ARRUDA - INST. AQ., KIT E CONVERSÃO", salesValue: 900, status: "FINALIZADO", payment: 900, createdAt: new Date("2025-03-21T00:00:00.000Z").getTime() },
  { id: "c5b7e3d9-f2a1-4e8f-a0c1-3d5b7e9f2a34", seller: "SERGIO", date: "2025-03-27", company: "ENGEAR", project: "1766", os: "132", area: "LOCAÇÃO", clientService: "ENGIE - LOCAÇÃO SUAPE 4 DIARIAS", salesValue: 10000, status: "FINALIZADO", payment: 10000, createdAt: new Date("2025-03-27T00:00:00.000Z").getTime() },
  { id: "d9f2a1c5-b7e3-4b8e-9f0a-1c5b7e3d9f3c", seller: "SERGIO", date: "2025-04-04", company: "CLIMAZONE", project: "1757", os: "129", area: "MANUT. AC", clientService: "MAG SHOPPING", salesValue: 0, status: "Á INICAR", payment: 0, createdAt: new Date("2025-04-04T00:00:00.000Z").getTime() },
  { id: "b7e3d9f2-a1c5-4e8f-a0c1-3d5b7e9f2a35", seller: "SERGIO", date: "2025-04-15", company: "ENGEAR", project: "1771", os: "", area: "GÁS", clientService: "SONIVALDO - REDE DE GÁS LAVANDERIA ACQUALIS", salesValue: 5000, status: "EM ANDAMENTO", payment: 0, createdAt: new Date("2025-04-15T00:00:00.000Z").getTime() },
  { id: "a1c5b7e3-d9f2-4b8e-9f0a-1c5b7e3d9f3d", seller: "SERGIO", date: "2025-04-15", company: "ENGEAR", project: "1772", os: "", area: "GÁS", clientService: "EDF. LECADRE - CONST. ATRIOS REG.VAZAMENTO - GARANTIA", salesValue: 0, status: "FINALIZADO", payment: 0, createdAt: new Date("2025-04-15T00:00:00.000Z").getTime() },
  { id: "e3d9f2a1-c5b7-4e8f-a0c1-3d5b7e9f2a36", seller: "SERGIO", date: "2025-04-23", company: "CLIMAZONE", project: "1774", os: "", area: "AQG", clientService: "HOTEL ANJOS - SR. MICHAEL", salesValue: 4000, status: "Á INICAR", payment: 0, createdAt: new Date("2025-04-23T00:00:00.000Z").getTime() },
  { id: "c5b7e3d9-f2a1-4e8f-a0c1-3d5b7e9f2a37", seller: "SERGIO", date: "2025-04-25", company: "CLIMAZONE", project: "1800", os: "", area: "AQG", clientService: "DR. BERILO PAI - SUBT.  PRESSURIZADORCONTROLADOR", salesValue: 0, status: "FINALIZADO", payment: 0, createdAt: new Date("2025-04-25T00:00:00.000Z").getTime() },
  { id: "d9f2a1c5-b7e3-4b8e-9f0a-1c5b7e3d9f3e", seller: "SERGIO", date: "2025-05-05", company: "CLIMAZONE", project: "1803", os: "63", area: "AQG", clientService: "SR. ARAKEN - SUBST. COLETOR SOLAR", salesValue: 2707, status: "FINALIZADO", payment: 2707, createdAt: new Date("2025-05-05T00:00:00.000Z").getTime() },
  { id: "b7e3d9f2-a1c5-4e8f-a0c1-3d5b7e9f2a38", seller: "SERGIO", date: "2025-05-07", company: "CLIMAZONE", project: "1804", os: "64", area: "INST. AC", clientService: "BENEDITO - INST. VRF SAMSUNG", salesValue: 13000, status: "Á INICAR", payment: 0, createdAt: new Date("2025-05-07T00:00:00.000Z").getTime() },
  { id: "a1c5b7e3-d9f2-4b8e-9f0a-1c5b7e3d9f3f", seller: "SERGIO", date: "2025-05-07", company: "CLIMAZONE", project: "1805", os: "138", area: "GÁS", clientService: "MENOR PREÇO - ADICIONAIS GÁS E CI", salesValue: 3215, status: "FINALIZADO", payment: 3215, createdAt: new Date("2025-05-07T00:00:00.000Z").getTime() },
  { id: "e3d9f2a1-c5b7-4e8f-a0c1-3d5b7e9f2a39", seller: "SERGIO", date: "2025-05-12", company: "CLIMAZONE", project: "1813", os: "", area: "GÁS", clientService: "TYH", salesValue: 350, status: "FINALIZADO", payment: 350, createdAt: new Date("2025-05-12T00:00:00.000Z").getTime() },
  { id: "c5b7e3d9-f2a1-4e8f-a0c1-3d5b7e9f2a3a", seller: "SERGIO", date: "2025-05-13", company: "CLIMAZONE", project: "1814", os: "", area: "GÁS", clientService: "MM ENGENHARIA - INST. REGISTROS BLOQUEIO", salesValue: 1900, status: "FINALIZADO", payment: 1900, createdAt: new Date("2025-05-13T00:00:00.000Z").getTime() },
  { id: "d9f2a1c5-b7e3-4b8e-9f0a-1c5b7e3d9f40", seller: "SERGIO", date: "2025-05-21", company: "CLIMAZONE", project: "1822", os: "", area: "AQG", clientService: "DR. REGIS BONFIM - ALPHAVILE SÓ INSTALAÇÃO", salesValue: 390, status: "FINALIZADO", payment: 0, createdAt: new Date("2025-05-21T00:00:00.000Z").getTime() },
  { id: "b7e3d9f2-a1c5-4e8f-a0c1-3d5b7e9f2a3b", seller: "SERGIO", date: "2025-05-21", company: "CLIMAZONE", project: "1823", os: "", area: "EXAUST", clientService: "WL MARCOLINO - INST. DUTOS COIFAS E VENTILADORES", salesValue: 10000, status: "Á INICAR", payment: 0, createdAt: new Date("2025-05-21T00:00:00.000Z").getTime() },
];


export const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSeller, setSelectedSellerState] = useState<Seller | typeof ALL_SELLERS_OPTION>(ALL_SELLERS_OPTION);
  const [filters, setFiltersState] = useState<SalesFilters>({ selectedYear: 'all' });
  const [loading, setLoading] = useState(true);

  // Efeito para carregar a preferência do vendedor selecionado do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedSeller = localStorage.getItem(LOCAL_STORAGE_SELECTED_SELLER_KEY);
      if (storedSeller && (SELLERS.includes(storedSeller as Seller) || storedSeller === ALL_SELLERS_OPTION)) {
        setSelectedSellerState(storedSeller as Seller | typeof ALL_SELLERS_OPTION);
      }
    }
  }, []); // Array de dependências vazio: roda uma vez na montagem do cliente

  // Efeito para carregar os dados de vendas
  useEffect(() => {
    setLoading(true);
    let dataToLoad: Sale[] = [];
    let loadedFromStorage = false;
    try {
      const storedSales = localStorage.getItem(LOCAL_STORAGE_SALES_KEY);
      if (storedSales) {
        const parsedSales = JSON.parse(storedSales);
        if (Array.isArray(parsedSales) && parsedSales.length > 0) {
            dataToLoad = parsedSales;
            loadedFromStorage = true;
        }
      }

      if (!loadedFromStorage) {
        dataToLoad = Array.isArray(exampleSalesForSergio) ? [...exampleSalesForSergio] : [];
        if (dataToLoad.length > 0) {
          localStorage.setItem(LOCAL_STORAGE_SALES_KEY, JSON.stringify(dataToLoad));
        }
      }
    } catch (error) {
      console.error("SalesContext: Error during initial data load. Falling back to example data.", error);
      localStorage.removeItem(LOCAL_STORAGE_SALES_KEY); 
      dataToLoad = Array.isArray(exampleSalesForSergio) ? [...exampleSalesForSergio] : [];
      if (dataToLoad.length > 0) {
        try {
          localStorage.setItem(LOCAL_STORAGE_SALES_KEY, JSON.stringify(dataToLoad));
        } catch (saveError) {
          console.error("SalesContext: Failed to save example data to localStorage after error", saveError);
        }
      }
    } finally {
      setSales(dataToLoad.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLoading(false);
    }
  }, []);

  // Efeito para persistir vendas no localStorage quando 'sales' ou 'loading' mudam
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
          const currentSeller = sale.seller; 
          updatedSale = {
            ...sale,
            ...saleUpdateData,
            seller: saleUpdateData.seller || currentSeller,
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
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_SELECTED_SELLER_KEY, seller);
    }
  }, []);

  const setFilters = useCallback((newFilters: Partial<SalesFilters>) => {
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
        if (!filters.selectedYear || filters.selectedYear === 'all') return true;
        const saleYear = new Date(sale.date).getFullYear();
        return saleYear === filters.selectedYear;
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
