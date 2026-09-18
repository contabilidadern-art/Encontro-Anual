
import React, { useState, useMemo, useEffect, memo, lazy, Suspense } from 'react';
import JSZip from 'jszip';
import {
  Upload, TrendingUp, Calculator, Layers, FolderOpen, User,
  MapPin, Percent, Receipt, Map as MapIcon, ChevronDown, ChevronUp,
  Calendar, DollarSign, Package, BarChart3, ArrowUpRight, LogOut, ShieldAlert, Briefcase, FileText,
  Filter, Star, RefreshCw, CheckCircle, List, Activity, X, Truck, ShoppingCart, Building2,
  Zap, Target, TrendingDown, AlertTriangle, Award, Users, Repeat, Scale, Download, BarChart2, Tag
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  USERS_DB,
  CFOP_CONVERSION_MAP,
  getICMSRate,
  REFORM_SCHEDULE,
  STATE_COORDINATES,
  CATEGORIAS_CREDITO,
  COLOR_MAP,
  NCM_REDUCOES,
  NCM_REDUCOES_AMBIGUOS,
  NBS_REDUCOES
} from './constants';
import SplashScreen from './SplashScreen';
import RegisterScreen from './RegisterScreen';
import CompanySetup from './CompanySetup';
import CompanySelector from './CompanySelector';
import AdminPanel, { getAprovados } from './AdminPanel';
import { UserPlus } from 'lucide-react';
import { db } from './firebase';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { discriminarNCM } from './ncmDiscriminator';
import NcmReviewQueue, { useNcmDecisoes } from './NcmReviewQueue';
import NcmGroupReview from './NcmGroupReview';
import NbsReviewQueue, { useNbsDecisoes } from './NbsReviewQueue';
import logoRN from './assets/logo-rn.png';
import { computeDashboardStats } from './report/ingest/dashboardStats';
import ReportContabil from './report/ReportContabil';
import ReportDP from './report/ReportDP';
import PeriodoSelector from './report/components/PeriodoSelector';
import { usePeriodo, usePeriodosDisponiveis, useMultiplosPeriodos } from './report/useReportData';
// XLSX carregado dinamicamente nos botões de exportar (evita ~300KB no bundle inicial)


// â"€â"€â"€ BRAND (cinza neutro substituindo laranja) â"€â"€â"€
const BRAND = {
  primary: 'bg-[#222222]', primaryHover: 'hover:bg-[#0d0d0d]',
  primaryText: 'text-[#222222]', primaryBorder: 'border-[#222222]',
  accent: 'bg-[#D9C14A]', accentHover: 'hover:bg-[#B8A030]',
  accentText: 'text-[#D9C14A]', accentBorder: 'border-[#D9C14A]',
  highlight: 'text-[#D9C14A]'
};

const ACCENT = '#D9C14A';
const ACCENT_HOVER = '#B8A030';

const UF_LIST = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

const SIMPLES_DB = {

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // 2027 — 2028  (mesma tabela para os dois anos)
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  '2027': {
    anexo1: {
      nome: 'Anexo I — Comércio',
      tributos: ['IRPJ','CSLL','CBS','CPP','ICMS','IBS'],
      faixas: [
        { limite:  180000, nominal:0.0400, deducao:      0, rep:[0.0550,0.0350,0.1533,0.4150,0.3400,0.0017] },
        { limite:  360000, nominal:0.0730, deducao:   5940, rep:[0.0550,0.0350,0.1533,0.4150,0.3400,0.0017] },
        { limite:  720000, nominal:0.0950, deducao:  13860, rep:[0.0550,0.0350,0.1533,0.4200,0.3350,0.0017] },
        { limite: 1800000, nominal:0.1070, deducao:  22500, rep:[0.0550,0.0350,0.1533,0.4200,0.3350,0.0017] },
        { limite: 3600000, nominal:0.1430, deducao:  87300, rep:[0.0550,0.0350,0.1533,0.4200,0.3350,0.0017] },
        { limite: 4800000, nominal:0.1890, deducao: 378000, rep:[0.1358,0.1006,0.3402,0.4234,0.0000,0.0000] },
      ],
    },
    anexo2: {
      nome: 'Anexo II — Indústria',
      tributos: ['IRPJ','CSLL','CBS','CPP','IPI','ICMS','IBS'],
      faixas: [
        { limite:  180000, nominal:0.0450, deducao:      0, rep:[0.0550,0.0350,0.1385,0.3750,0.0750,0.3200,0.0015] },
        { limite:  360000, nominal:0.0780, deducao:   5940, rep:[0.0550,0.0350,0.1385,0.3750,0.0750,0.3200,0.0015] },
        { limite:  720000, nominal:0.1000, deducao:  13860, rep:[0.0550,0.0350,0.1385,0.3750,0.0750,0.3200,0.0015] },
        { limite: 1800000, nominal:0.1120, deducao:  22500, rep:[0.0550,0.0350,0.1385,0.3750,0.0750,0.3200,0.0015] },
        { limite: 3600000, nominal:0.1470, deducao:  85500, rep:[0.0550,0.0350,0.1385,0.3750,0.0750,0.3200,0.0015] },
        { limite: 4800000, nominal:0.2990, deducao: 720000, rep:[0.0853,0.0753,0.2522,0.2359,0.3513,0.0000,0.0000] },
      ],
    },
    anexo3: {
      nome: 'Anexo III — Serviços (Locação / Geral)',
      tributos: ['IRPJ','CSLL','CBS','CPP','ISS','IBS'],
      obs: '⚠ Na 5ª faixa com alíquota efetiva > 14,93%, ISS fica fixo em 5% e excedente redistribui aos federais.',
      faixas: [
        { limite:  180000, nominal:0.0600, deducao:      0, rep:[0.0400,0.0350,0.1543,0.4340,0.3350,0.0017] },
        { limite:  360000, nominal:0.1120, deducao:   9360, rep:[0.0400,0.0350,0.1691,0.4340,0.3200,0.0019] },
        { limite:  720000, nominal:0.1350, deducao:  17640, rep:[0.0400,0.0350,0.1642,0.4340,0.3250,0.0019] },
        { limite: 1800000, nominal:0.1600, deducao:  35640, rep:[0.0400,0.0350,0.1642,0.4340,0.3250,0.0019] },
        { limite: 3600000, nominal:0.2100, deducao: 125640, rep:[0.0400,0.0350,0.1543,0.4340,0.3350,0.0017] },
        { limite: 4800000, nominal:0.3290, deducao: 648000, rep:[0.3509,0.1504,0.1929,0.3058,0.0000,0.0000] },
      ],
    },
    anexo4: {
      nome: 'Anexo IV — Serviços §5ºC (sem CPP)',
      tributos: ['IRPJ','CSLL','CBS','ISS','IBS'],
      obs: '⚠ CPP recolhido separadamente — não incluso no DAS.',
      faixas: [
        { limite:  180000, nominal:0.0450, deducao:      0, rep:[0.1880,0.1520,0.2126,0.4450,0.0024] },
        { limite:  360000, nominal:0.0900, deducao:   8100, rep:[0.1980,0.1520,0.2473,0.4000,0.0027] },
        { limite:  720000, nominal:0.1020, deducao:  12420, rep:[0.2080,0.1520,0.2374,0.4000,0.0026] },
        { limite: 1800000, nominal:0.1400, deducao:  39780, rep:[0.1780,0.1920,0.2275,0.4000,0.0025] },
        { limite: 3600000, nominal:0.2200, deducao: 183780, rep:[0.1880,0.1920,0.2176,0.4000,0.0024] },
        { limite: 4800000, nominal:0.3290, deducao: 828000, rep:[0.5371,0.2159,0.2470,0.0000,0.0000] },
      ],
    },
    anexo5: {
      nome: 'Anexo V — Serviços §5ºI (Fator R)',
      tributos: ['IRPJ','CSLL','CBS','CPP','ISS','IBS'],
      obs: '⚠ Se Fator r ≥ 28%, tributar pelo Anexo III.',
      faixas: [
        { limite:  180000, nominal:0.1550, deducao:      0, rep:[0.2500,0.1500,0.1696,0.2885,0.1400,0.0019] },
        { limite:  360000, nominal:0.1800, deducao:   4500, rep:[0.2300,0.1500,0.1696,0.2785,0.1700,0.0019] },
        { limite:  720000, nominal:0.1950, deducao:   9900, rep:[0.2400,0.1500,0.1795,0.2385,0.1900,0.0020] },
        { limite: 1800000, nominal:0.2050, deducao:  17100, rep:[0.2100,0.1500,0.1894,0.2385,0.2100,0.0021] },
        { limite: 3600000, nominal:0.2300, deducao:  62100, rep:[0.2300,0.1250,0.1696,0.2385,0.2350,0.0019] },
        { limite: 4800000, nominal:0.3040, deducao: 540000, rep:[0.3510,0.1554,0.1978,0.2958,0.0000,0.0000] },
      ],
    },
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // 2029
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  '2029': {
    anexo1: {
      nome: 'Anexo I — Comércio',
      tributos: ['IRPJ','CSLL','CBS','CPP','ICMS','IBS'],
      faixas: [
        { limite:  180000, nominal:0.0400, deducao:      0, rep:[0.0550,0.0350,0.1550,0.4150,0.3060,0.0340] },
        { limite:  360000, nominal:0.0730, deducao:   5940, rep:[0.0550,0.0350,0.1550,0.4150,0.3060,0.0340] },
        { limite:  720000, nominal:0.0950, deducao:  13860, rep:[0.0550,0.0350,0.1550,0.4200,0.3015,0.0335] },
        { limite: 1800000, nominal:0.1070, deducao:  22500, rep:[0.0550,0.0350,0.1550,0.4200,0.3015,0.0335] },
        { limite: 3600000, nominal:0.1430, deducao:  87300, rep:[0.0550,0.0350,0.1550,0.4200,0.3015,0.0335] },
        { limite: 4800000, nominal:0.1900, deducao: 378000, rep:[0.1350,0.1000,0.3440,0.4210,0.0000,0.0000] },
      ],
    },
    anexo2: {
      nome: 'Anexo II — Indústria',
      tributos: ['IRPJ','CSLL','CBS','CPP','IPI','ICMS','IBS'],
      faixas: [
        { limite:  180000, nominal:0.0450, deducao:      0, rep:[0.0550,0.0350,0.1400,0.3750,0.0750,0.2880,0.0320] },
        { limite:  360000, nominal:0.0780, deducao:   5940, rep:[0.0550,0.0350,0.1400,0.3750,0.0750,0.2880,0.0320] },
        { limite:  720000, nominal:0.1000, deducao:  13860, rep:[0.0550,0.0350,0.1400,0.3750,0.0750,0.2880,0.0320] },
        { limite: 1800000, nominal:0.1120, deducao:  22500, rep:[0.0550,0.0350,0.1400,0.3750,0.0750,0.2880,0.0320] },
        { limite: 3600000, nominal:0.1470, deducao:  85500, rep:[0.0550,0.0350,0.1400,0.3750,0.0750,0.2880,0.0320] },
        { limite: 4800000, nominal:0.3000, deducao: 720000, rep:[0.0850,0.0750,0.2550,0.2350,0.3500,0.0000,0.0000] },
      ],
    },
    anexo3: {
      nome: 'Anexo III — Serviços (Locação / Geral)',
      tributos: ['IRPJ','CSLL','CBS','CPP','ISS','IBS'],
      obs: '⚠ Na 5ª faixa com alíquota efetiva > 14,93%, ISS fica fixo em 4,5% e excedente redistribui.',
      faixas: [
        { limite:  180000, nominal:0.0600, deducao:      0, rep:[0.0400,0.0350,0.1560,0.4340,0.3015,0.0335] },
        { limite:  360000, nominal:0.1120, deducao:   9360, rep:[0.0400,0.0350,0.1710,0.4340,0.2880,0.0320] },
        { limite:  720000, nominal:0.1350, deducao:  17640, rep:[0.0400,0.0350,0.1660,0.4340,0.2925,0.0325] },
        { limite: 1800000, nominal:0.1600, deducao:  35640, rep:[0.0400,0.0350,0.1660,0.4340,0.2925,0.0325] },
        { limite: 3600000, nominal:0.2100, deducao: 125640, rep:[0.0400,0.0350,0.1560,0.4340,0.3015,0.0335] },
        { limite: 4800000, nominal:0.3300, deducao: 648000, rep:[0.3500,0.1500,0.1950,0.3050,0.0000,0.0000] },
      ],
    },
    anexo4: {
      nome: 'Anexo IV — Serviços §5ºC (sem CPP)',
      tributos: ['IRPJ','CSLL','CBS','ISS','IBS'],
      obs: '⚠ CPP recolhido separadamente — não incluso no DAS.',
      faixas: [
        { limite:  180000, nominal:0.0450, deducao:      0, rep:[0.1880,0.1520,0.2150,0.4005,0.0445] },
        { limite:  360000, nominal:0.0900, deducao:   8100, rep:[0.1980,0.1520,0.2500,0.3600,0.0400] },
        { limite:  720000, nominal:0.1020, deducao:  12420, rep:[0.2080,0.1520,0.2400,0.3600,0.0400] },
        { limite: 1800000, nominal:0.1400, deducao:  39780, rep:[0.1780,0.1920,0.2300,0.3600,0.0400] },
        { limite: 3600000, nominal:0.2200, deducao: 183780, rep:[0.1880,0.1920,0.2200,0.3600,0.0400] },
        { limite: 4800000, nominal:0.3300, deducao: 828000, rep:[0.5350,0.2150,0.2500,0.0000,0.0000] },
      ],
    },
    anexo5: {
      nome: 'Anexo V — Serviços §5ºI (Fator R)',
      tributos: ['IRPJ','CSLL','CBS','CPP','ISS','IBS'],
      obs: '⚠ Se Fator r ≥ 28%, tributar pelo Anexo III.',
      faixas: [
        { limite:  180000, nominal:0.1550, deducao:      0, rep:[0.2500,0.1500,0.1715,0.2885,0.1260,0.0140] },
        { limite:  360000, nominal:0.1800, deducao:   4500, rep:[0.2300,0.1500,0.1715,0.2785,0.1530,0.0170] },
        { limite:  720000, nominal:0.1950, deducao:   9900, rep:[0.2400,0.1500,0.1815,0.2385,0.1710,0.0190] },
        { limite: 1800000, nominal:0.2050, deducao:  17100, rep:[0.2100,0.1500,0.1915,0.2385,0.1890,0.0210] },
        { limite: 3600000, nominal:0.2300, deducao:  62100, rep:[0.2300,0.1250,0.1715,0.2385,0.2115,0.0235] },
        { limite: 4800000, nominal:0.3050, deducao: 540000, rep:[0.3500,0.1550,0.2000,0.2950,0.0000,0.0000] },
      ],
    },
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // 2030
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  '2030': {
    anexo1: {
      nome: 'Anexo I — Comércio',
      tributos: ['IRPJ','CSLL','CBS','CPP','ICMS','IBS'],
      faixas: [
        { limite:  180000, nominal:0.0400, deducao:      0, rep:[0.0550,0.0350,0.1550,0.4150,0.2720,0.0680] },
        { limite:  360000, nominal:0.0730, deducao:   5940, rep:[0.0550,0.0350,0.1550,0.4150,0.2720,0.0680] },
        { limite:  720000, nominal:0.0950, deducao:  13860, rep:[0.0550,0.0350,0.1550,0.4200,0.2680,0.0670] },
        { limite: 1800000, nominal:0.1070, deducao:  22500, rep:[0.0550,0.0350,0.1550,0.4200,0.2680,0.0670] },
        { limite: 3600000, nominal:0.1430, deducao:  87300, rep:[0.0550,0.0350,0.1550,0.4200,0.2680,0.0670] },
        { limite: 4800000, nominal:0.1900, deducao: 378000, rep:[0.1350,0.1000,0.3440,0.4210,0.0000,0.0000] },
      ],
    },
    anexo2: {
      nome: 'Anexo II — Indústria',
      tributos: ['IRPJ','CSLL','CBS','CPP','IPI','ICMS','IBS'],
      faixas: [
        { limite:  180000, nominal:0.0450, deducao:      0, rep:[0.0550,0.0350,0.1400,0.3750,0.0750,0.2560,0.0640] },
        { limite:  360000, nominal:0.0780, deducao:   5940, rep:[0.0550,0.0350,0.1400,0.3750,0.0750,0.2560,0.0640] },
        { limite:  720000, nominal:0.1000, deducao:  13860, rep:[0.0550,0.0350,0.1400,0.3750,0.0750,0.2560,0.0640] },
        { limite: 1800000, nominal:0.1120, deducao:  22500, rep:[0.0550,0.0350,0.1400,0.3750,0.0750,0.2560,0.0640] },
        { limite: 3600000, nominal:0.1470, deducao:  85500, rep:[0.0550,0.0350,0.1400,0.3750,0.0750,0.2560,0.0640] },
        { limite: 4800000, nominal:0.3000, deducao: 720000, rep:[0.0850,0.0750,0.2550,0.2350,0.3500,0.0000,0.0000] },
      ],
    },
    anexo3: {
      nome: 'Anexo III — Serviços (Locação / Geral)',
      tributos: ['IRPJ','CSLL','CBS','CPP','ISS','IBS'],
      obs: '⚠ Na 5ª faixa com alíquota efetiva > 14,93%, ISS fica fixo em 4,0% e excedente redistribui.',
      faixas: [
        { limite:  180000, nominal:0.0600, deducao:      0, rep:[0.0400,0.0350,0.1560,0.4340,0.2680,0.0670] },
        { limite:  360000, nominal:0.1120, deducao:   9360, rep:[0.0400,0.0350,0.1710,0.4340,0.2560,0.0640] },
        { limite:  720000, nominal:0.1350, deducao:  17640, rep:[0.0400,0.0350,0.1660,0.4340,0.2600,0.0650] },
        { limite: 1800000, nominal:0.1600, deducao:  35640, rep:[0.0400,0.0350,0.1660,0.4340,0.2600,0.0650] },
        { limite: 3600000, nominal:0.2100, deducao: 125640, rep:[0.0400,0.0350,0.1560,0.4340,0.2680,0.0670] },
        { limite: 4800000, nominal:0.3300, deducao: 648000, rep:[0.3500,0.1500,0.1950,0.3050,0.0000,0.0000] },
      ],
    },
    anexo4: {
      nome: 'Anexo IV — Serviços §5ºC (sem CPP)',
      tributos: ['IRPJ','CSLL','CBS','ISS','IBS'],
      obs: '⚠ CPP recolhido separadamente — não incluso no DAS.',
      faixas: [
        { limite:  180000, nominal:0.0450, deducao:      0, rep:[0.1880,0.1520,0.2150,0.3560,0.0890] },
        { limite:  360000, nominal:0.0900, deducao:   8100, rep:[0.1980,0.1520,0.2500,0.3200,0.0800] },
        { limite:  720000, nominal:0.1020, deducao:  12420, rep:[0.2080,0.1520,0.2400,0.3200,0.0800] },
        { limite: 1800000, nominal:0.1400, deducao:  39780, rep:[0.1780,0.1920,0.2300,0.3200,0.0800] },
        { limite: 3600000, nominal:0.2200, deducao: 183780, rep:[0.1880,0.1920,0.2200,0.3200,0.0800] },
        { limite: 4800000, nominal:0.3300, deducao: 828000, rep:[0.5350,0.2150,0.2500,0.0000,0.0000] },
      ],
    },
    anexo5: {
      nome: 'Anexo V — Serviços §5ºI (Fator R)',
      tributos: ['IRPJ','CSLL','CBS','CPP','ISS','IBS'],
      obs: '⚠ Se Fator r ≥ 28%, tributar pelo Anexo III.',
      faixas: [
        { limite:  180000, nominal:0.1550, deducao:      0, rep:[0.2500,0.1500,0.1715,0.2885,0.1120,0.0280] },
        { limite:  360000, nominal:0.1800, deducao:   4500, rep:[0.2300,0.1500,0.1715,0.2785,0.1360,0.0340] },
        { limite:  720000, nominal:0.1950, deducao:   9900, rep:[0.2400,0.1500,0.1815,0.2385,0.1520,0.0380] },
        { limite: 1800000, nominal:0.2050, deducao:  17100, rep:[0.2100,0.1500,0.1915,0.2385,0.1680,0.0420] },
        { limite: 3600000, nominal:0.2300, deducao:  62100, rep:[0.2300,0.1250,0.1715,0.2385,0.1880,0.0470] },
        { limite: 4800000, nominal:0.3050, deducao: 540000, rep:[0.3500,0.1550,0.2000,0.2950,0.0000,0.0000] },
      ],
    },
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // 2031
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  '2031': {
    anexo1: {
      nome: 'Anexo I — Comércio',
      tributos: ['IRPJ','CSLL','CBS','CPP','ICMS','IBS'],
      faixas: [
        { limite:  180000, nominal:0.0400, deducao:      0, rep:[0.0550,0.0350,0.1550,0.4150,0.2380,0.1020] },
        { limite:  360000, nominal:0.0730, deducao:   5940, rep:[0.0550,0.0350,0.1550,0.4150,0.2380,0.1020] },
        { limite:  720000, nominal:0.0950, deducao:  13860, rep:[0.0550,0.0350,0.1550,0.4200,0.2345,0.1005] },
        { limite: 1800000, nominal:0.1070, deducao:  22500, rep:[0.0550,0.0350,0.1550,0.4200,0.2345,0.1005] },
        { limite: 3600000, nominal:0.1430, deducao:  87300, rep:[0.0550,0.0350,0.1550,0.4200,0.2345,0.1005] },
        { limite: 4800000, nominal:0.1900, deducao: 378000, rep:[0.1350,0.1000,0.3440,0.4210,0.0000,0.0000] },
      ],
    },
    anexo2: {
      nome: 'Anexo II — Indústria',
      tributos: ['IRPJ','CSLL','CBS','CPP','IPI','ICMS','IBS'],
      faixas: [
        { limite:  180000, nominal:0.0450, deducao:      0, rep:[0.0550,0.0350,0.1400,0.3750,0.0750,0.2240,0.0960] },
        { limite:  360000, nominal:0.0780, deducao:   5940, rep:[0.0550,0.0350,0.1400,0.3750,0.0750,0.2240,0.0960] },
        { limite:  720000, nominal:0.1000, deducao:  13860, rep:[0.0550,0.0350,0.1400,0.3750,0.0750,0.2240,0.0960] },
        { limite: 1800000, nominal:0.1120, deducao:  22500, rep:[0.0550,0.0350,0.1400,0.3750,0.0750,0.2240,0.0960] },
        { limite: 3600000, nominal:0.1470, deducao:  85500, rep:[0.0550,0.0350,0.1400,0.3750,0.0750,0.2240,0.0960] },
        { limite: 4800000, nominal:0.3000, deducao: 720000, rep:[0.0850,0.0750,0.2550,0.2350,0.3500,0.0000,0.0000] },
      ],
    },
    anexo3: {
      nome: 'Anexo III — Serviços (Locação / Geral)',
      tributos: ['IRPJ','CSLL','CBS','CPP','ISS','IBS'],
      obs: '⚠ Na 5ª faixa com alíquota efetiva > 14,93%, ISS fica fixo em 3,5% e excedente redistribui.',
      faixas: [
        { limite:  180000, nominal:0.0600, deducao:      0, rep:[0.0400,0.0350,0.1560,0.4340,0.2345,0.1005] },
        { limite:  360000, nominal:0.1120, deducao:   9360, rep:[0.0400,0.0350,0.1710,0.4340,0.2240,0.0960] },
        { limite:  720000, nominal:0.1350, deducao:  17640, rep:[0.0400,0.0350,0.1660,0.4340,0.2275,0.0975] },
        { limite: 1800000, nominal:0.1600, deducao:  35640, rep:[0.0400,0.0350,0.1660,0.4340,0.2275,0.0975] },
        { limite: 3600000, nominal:0.2100, deducao: 125640, rep:[0.0400,0.0350,0.1560,0.4340,0.2345,0.1005] },
        { limite: 4800000, nominal:0.3300, deducao: 648000, rep:[0.3500,0.1500,0.1950,0.3050,0.0000,0.0000] },
      ],
    },
    anexo4: {
      nome: 'Anexo IV — Serviços §5ºC (sem CPP)',
      tributos: ['IRPJ','CSLL','CBS','ISS','IBS'],
      obs: '⚠ CPP recolhido separadamente — não incluso no DAS.',
      faixas: [
        { limite:  180000, nominal:0.0450, deducao:      0, rep:[0.1880,0.1520,0.2150,0.3115,0.1335] },
        { limite:  360000, nominal:0.0900, deducao:   8100, rep:[0.1980,0.1520,0.2500,0.2800,0.1200] },
        { limite:  720000, nominal:0.1020, deducao:  12420, rep:[0.2080,0.1520,0.2400,0.2800,0.1200] },
        { limite: 1800000, nominal:0.1400, deducao:  39780, rep:[0.1780,0.1920,0.2300,0.2800,0.1200] },
        { limite: 3600000, nominal:0.2200, deducao: 183780, rep:[0.1880,0.1920,0.2200,0.2800,0.1200] },
        { limite: 4800000, nominal:0.3300, deducao: 828000, rep:[0.5350,0.2150,0.2500,0.0000,0.0000] },
      ],
    },
    anexo5: {
      nome: 'Anexo V — Serviços §5ºI (Fator R)',
      tributos: ['IRPJ','CSLL','CBS','CPP','ISS','IBS'],
      obs: '⚠ Se Fator r ≥ 28%, tributar pelo Anexo III.',
      faixas: [
        { limite:  180000, nominal:0.1550, deducao:      0, rep:[0.2500,0.1500,0.1715,0.2885,0.0980,0.0420] },
        { limite:  360000, nominal:0.1800, deducao:   4500, rep:[0.2300,0.1500,0.1715,0.2785,0.1190,0.0510] },
        { limite:  720000, nominal:0.1950, deducao:   9900, rep:[0.2400,0.1500,0.1815,0.2385,0.1330,0.0570] },
        { limite: 1800000, nominal:0.2050, deducao:  17100, rep:[0.2100,0.1500,0.1915,0.2385,0.1470,0.0630] },
        { limite: 3600000, nominal:0.2300, deducao:  62100, rep:[0.2300,0.1250,0.1715,0.2385,0.1645,0.0705] },
        { limite: 4800000, nominal:0.3050, deducao: 540000, rep:[0.3500,0.1550,0.2000,0.2950,0.0000,0.0000] },
      ],
    },
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // 2032
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  '2032': {
    anexo1: {
      nome: 'Anexo I — Comércio',
      tributos: ['IRPJ','CSLL','CBS','CPP','ICMS','IBS'],
      faixas: [
        { limite:  180000, nominal:0.0400, deducao:      0, rep:[0.0550,0.0350,0.1550,0.4150,0.2040,0.1360] },
        { limite:  360000, nominal:0.0730, deducao:   5940, rep:[0.0550,0.0350,0.1550,0.4150,0.2040,0.1360] },
        { limite:  720000, nominal:0.0950, deducao:  13860, rep:[0.0550,0.0350,0.1550,0.4200,0.2010,0.1340] },
        { limite: 1800000, nominal:0.1070, deducao:  22500, rep:[0.0550,0.0350,0.1550,0.4200,0.2010,0.1340] },
        { limite: 3600000, nominal:0.1430, deducao:  87300, rep:[0.0550,0.0350,0.1550,0.4200,0.2010,0.1340] },
        { limite: 4800000, nominal:0.1900, deducao: 378000, rep:[0.1350,0.1000,0.3440,0.4210,0.0000,0.0000] },
      ],
    },
    anexo2: {
      nome: 'Anexo II — Indústria',
      tributos: ['IRPJ','CSLL','CBS','CPP','IPI','ICMS','IBS'],
      faixas: [
        { limite:  180000, nominal:0.0450, deducao:      0, rep:[0.0550,0.0350,0.1400,0.3750,0.0750,0.1920,0.1280] },
        { limite:  360000, nominal:0.0780, deducao:   5940, rep:[0.0550,0.0350,0.1400,0.3750,0.0750,0.1920,0.1280] },
        { limite:  720000, nominal:0.1000, deducao:  13860, rep:[0.0550,0.0350,0.1400,0.3750,0.0750,0.1920,0.1280] },
        { limite: 1800000, nominal:0.1120, deducao:  22500, rep:[0.0550,0.0350,0.1400,0.3750,0.0750,0.1920,0.1280] },
        { limite: 3600000, nominal:0.1470, deducao:  85500, rep:[0.0550,0.0350,0.1400,0.3750,0.0750,0.1920,0.1280] },
        { limite: 4800000, nominal:0.3000, deducao: 720000, rep:[0.0850,0.0750,0.2550,0.2350,0.3500,0.0000,0.0000] },
      ],
    },
    anexo3: {
      nome: 'Anexo III — Serviços (Locação / Geral)',
      tributos: ['IRPJ','CSLL','CBS','CPP','ISS','IBS'],
      obs: '⚠ Na 5ª faixa com alíquota efetiva > 14,93%, ISS fica fixo em 3,0% e excedente redistribui.',
      faixas: [
        { limite:  180000, nominal:0.0600, deducao:      0, rep:[0.0400,0.0350,0.1560,0.4340,0.2010,0.1340] },
        { limite:  360000, nominal:0.1120, deducao:   9360, rep:[0.0400,0.0350,0.1710,0.4340,0.1920,0.1280] },
        { limite:  720000, nominal:0.1350, deducao:  17640, rep:[0.0400,0.0350,0.1660,0.4340,0.1950,0.1300] },
        { limite: 1800000, nominal:0.1600, deducao:  35640, rep:[0.0400,0.0350,0.1660,0.4340,0.1950,0.1300] },
        { limite: 3600000, nominal:0.2100, deducao: 125640, rep:[0.0400,0.0350,0.1560,0.4340,0.2010,0.1340] },
        { limite: 4800000, nominal:0.3300, deducao: 648000, rep:[0.3500,0.1500,0.1950,0.3050,0.0000,0.0000] },
      ],
    },
    anexo4: {
      nome: 'Anexo IV — Serviços §5ºC (sem CPP)',
      tributos: ['IRPJ','CSLL','CBS','ISS','IBS'],
      obs: '⚠ CPP recolhido separadamente — não incluso no DAS.',
      faixas: [
        { limite:  180000, nominal:0.0450, deducao:      0, rep:[0.1880,0.1520,0.2150,0.2670,0.1780] },
        { limite:  360000, nominal:0.0900, deducao:   8100, rep:[0.1980,0.1520,0.2500,0.2400,0.1600] },
        { limite:  720000, nominal:0.1020, deducao:  12420, rep:[0.2080,0.1520,0.2400,0.2400,0.1600] },
        { limite: 1800000, nominal:0.1400, deducao:  39780, rep:[0.1780,0.1920,0.2300,0.2400,0.1600] },
        { limite: 3600000, nominal:0.2200, deducao: 183780, rep:[0.1880,0.1920,0.2200,0.2400,0.1600] },
        { limite: 4800000, nominal:0.3300, deducao: 828000, rep:[0.5350,0.2150,0.2500,0.0000,0.0000] },
      ],
    },
    anexo5: {
      nome: 'Anexo V — Serviços §5ºI (Fator R)',
      tributos: ['IRPJ','CSLL','CBS','CPP','ISS','IBS'],
      obs: '⚠ Se Fator r ≥ 28%, tributar pelo Anexo III.',
      faixas: [
        { limite:  180000, nominal:0.1550, deducao:      0, rep:[0.2500,0.1500,0.1715,0.2885,0.0840,0.0560] },
        { limite:  360000, nominal:0.1800, deducao:   4500, rep:[0.2300,0.1500,0.1715,0.2785,0.1020,0.0680] },
        { limite:  720000, nominal:0.1950, deducao:   9900, rep:[0.2400,0.1500,0.1815,0.2385,0.1140,0.0760] },
        { limite: 1800000, nominal:0.2050, deducao:  17100, rep:[0.2100,0.1500,0.1915,0.2385,0.1260,0.0840] },
        { limite: 3600000, nominal:0.2300, deducao:  62100, rep:[0.2300,0.1250,0.1715,0.2385,0.1410,0.0940] },
        { limite: 4800000, nominal:0.3050, deducao: 540000, rep:[0.3500,0.1550,0.2000,0.2950,0.0000,0.0000] },
      ],
    },
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // 2033+ — ICMS zerado no I/II; ISS zerado no III/IV/V
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  '2033': {
    anexo1: {
      nome: 'Anexo I — Comércio',
      tributos: ['IRPJ','CSLL','CBS','CPP','IBS'],
      faixas: [
        { limite:  180000, nominal:0.0400, deducao:      0, rep:[0.0550,0.0350,0.1550,0.4150,0.3400] },
        { limite:  360000, nominal:0.0730, deducao:   5940, rep:[0.0550,0.0350,0.1550,0.4150,0.3400] },
        { limite:  720000, nominal:0.0950, deducao:  13860, rep:[0.0550,0.0350,0.1550,0.4200,0.3350] },
        { limite: 1800000, nominal:0.1070, deducao:  22500, rep:[0.0550,0.0350,0.1550,0.4200,0.3350] },
        { limite: 3600000, nominal:0.1430, deducao:  87300, rep:[0.0550,0.0350,0.1550,0.4200,0.3350] },
        { limite: 4800000, nominal:0.1900, deducao: 378000, rep:[0.1350,0.1000,0.3440,0.4210,0.0000] },
      ],
    },
    anexo2: {
      nome: 'Anexo II — Indústria',
      tributos: ['IRPJ','CSLL','CBS','CPP','IPI','IBS'],
      faixas: [
        { limite:  180000, nominal:0.0450, deducao:      0, rep:[0.0550,0.0350,0.1400,0.3750,0.0750,0.3200] },
        { limite:  360000, nominal:0.0780, deducao:   5940, rep:[0.0550,0.0350,0.1400,0.3750,0.0750,0.3200] },
        { limite:  720000, nominal:0.1000, deducao:  13860, rep:[0.0550,0.0350,0.1400,0.3750,0.0750,0.3200] },
        { limite: 1800000, nominal:0.1120, deducao:  22500, rep:[0.0550,0.0350,0.1400,0.3750,0.0750,0.3200] },
        { limite: 3600000, nominal:0.1470, deducao:  85500, rep:[0.0550,0.0350,0.1400,0.3750,0.0750,0.3200] },
        { limite: 4800000, nominal:0.3000, deducao: 720000, rep:[0.0850,0.0750,0.2550,0.2350,0.3500,0.0000] },
      ],
    },
    anexo3: {
      nome: 'Anexo III — Serviços (Locação / Geral)',
      tributos: ['IRPJ','CSLL','CBS','CPP','IBS'],
      faixas: [
        { limite:  180000, nominal:0.0600, deducao:      0, rep:[0.0400,0.0350,0.1560,0.4340,0.3350] },
        { limite:  360000, nominal:0.1120, deducao:   9360, rep:[0.0400,0.0350,0.1710,0.4340,0.3200] },
        { limite:  720000, nominal:0.1350, deducao:  17640, rep:[0.0400,0.0350,0.1660,0.4340,0.3250] },
        { limite: 1800000, nominal:0.1600, deducao:  35640, rep:[0.0400,0.0350,0.1660,0.4340,0.3250] },
        { limite: 3600000, nominal:0.2100, deducao: 125640, rep:[0.0400,0.0350,0.1560,0.4340,0.3350] },
        { limite: 4800000, nominal:0.3300, deducao: 648000, rep:[0.3500,0.1500,0.1950,0.3050,0.0000] },
      ],
    },
    anexo4: {
      nome: 'Anexo IV — Serviços §5ºC (sem CPP)',
      tributos: ['IRPJ','CSLL','CBS','IBS'],
      obs: '⚠ CPP recolhido separadamente — não incluso no DAS.',
      faixas: [
        { limite:  180000, nominal:0.0450, deducao:      0, rep:[0.1880,0.1520,0.2150,0.4450] },
        { limite:  360000, nominal:0.0900, deducao:   8100, rep:[0.1980,0.1520,0.2500,0.4000] },
        { limite:  720000, nominal:0.1020, deducao:  12420, rep:[0.2080,0.1520,0.2400,0.4000] },
        { limite: 1800000, nominal:0.1400, deducao:  39780, rep:[0.1780,0.1920,0.2300,0.4000] },
        { limite: 3600000, nominal:0.2200, deducao: 183780, rep:[0.1880,0.1920,0.2200,0.4000] },
        { limite: 4800000, nominal:0.3300, deducao: 828000, rep:[0.5350,0.2150,0.2500,0.0000] },
      ],
    },
    anexo5: {
      nome: 'Anexo V — Serviços §5ºI (Fator R)',
      tributos: ['IRPJ','CSLL','CBS','CPP','IBS'],
      obs: '⚠ Se Fator r ≥ 28%, tributar pelo Anexo III.',
      faixas: [
        { limite:  180000, nominal:0.1550, deducao:      0, rep:[0.2500,0.1500,0.1715,0.2885,0.1400] },
        { limite:  360000, nominal:0.1800, deducao:   4500, rep:[0.2300,0.1500,0.1715,0.2785,0.1700] },
        { limite:  720000, nominal:0.1950, deducao:   9900, rep:[0.2400,0.1500,0.1815,0.2385,0.1900] },
        { limite: 1800000, nominal:0.2050, deducao:  17100, rep:[0.2100,0.1500,0.1915,0.2385,0.2100] },
        { limite: 3600000, nominal:0.2300, deducao:  62100, rep:[0.2300,0.1250,0.1715,0.2385,0.2350] },
        { limite: 4800000, nominal:0.3050, deducao: 540000, rep:[0.3500,0.1550,0.2000,0.2950,0.0000] },
      ],
    },
  },
};

const smartUnit = (u) => {
  if (!u) return '';
  const s = u.toString().toLowerCase().trim();
  if (['kg','kilo','quilograma','kilograma'].includes(s)) return 'kg';
  if (['un','und','unid','unidade','pc','pç','pca','peca'].includes(s)) return 'un';
  if (['m','mt','mtr','metro'].includes(s)) return 'm';
  if (['m2','m²','mt2'].includes(s)) return 'm²';
  if (['l','lt','litro'].includes(s)) return 'L';
  if (['cx','caixa','cxa'].includes(s)) return 'cx';
  if (['ton','t'].includes(s)) return 'ton';
  if (['par','pr'].includes(s)) return 'par';
  return s;
};

const smartNumber = (value, unitRaw) => {
  if (value === undefined || value === null) return '0';
  const unit = smartUnit(unitRaw);
  let fd = 2;
  if (['kg','m','L','ton'].includes(unit)) fd = 3;
  if (['un','cx','par'].includes(unit)) fd = Number.isInteger(value) ? 0 : 2;
  return value.toLocaleString('pt-BR', { minimumFractionDigits: fd, maximumFractionDigits: fd });
};

const cleanCNPJ = v => v ? v.replace(/\D/g, '') : '';

const safeExtract = (parent, tag) => {
  if (!parent) return '';
  const col = parent.getElementsByTagName(tag);
  return col && col.length > 0 ? col[0].textContent : '';
};

const safeNumber = v => { if (!v) return 0; const n = parseFloat(v.toString().replace(',','.')); return isNaN(n) ? 0 : n; };

const IBGE_UF_MAP = {'11':'RO','12':'AC','13':'AM','14':'RR','15':'PA','16':'AP','17':'TO','21':'MA','22':'PI','23':'CE','24':'RN','25':'PB','26':'PE','27':'AL','28':'SE','29':'BA','31':'MG','32':'ES','33':'RJ','35':'SP','41':'PR','42':'SC','43':'RS','50':'MS','51':'MT','52':'GO','53':'DF'};

// ← ADICIONAR AQUI
const converterCFOPEntrada = (cfop) => {
  if (!cfop) return cfop;
  const mapa = { '5': '1', '6': '2', '7': '3' };
  const primeiro = cfop[0];
  return mapa[primeiro] ? mapa[primeiro] + cfop.slice(1) : cfop;
};

// confirmacaoIdx: undefined = pendente, null = "nenhuma se aplica", number = índice confirmado
const getReducaoNCM = (ncm, confirmacaoIdx) => {
  if (!ncm) return null;
  const n = ncm.replace(/\D/g, '').padStart(8, '0');

  const opcoes = NCM_REDUCOES_AMBIGUOS[n];
  if (opcoes) {
    if (confirmacaoIdx === null) return null;
    if (typeof confirmacaoIdx === 'number') return opcoes[confirmacaoIdx];
    // Pendente: retorna marcador — fiscalmente seguro (reducao: 0 até confirmar)
    return { _ambiguous: true, reducao: 0, opcoes, tipo: 'Aguardando confirmação', anexo: '—', desc: 'NCM com múltiplas descrições fiscais — confirme o enquadramento do produto.' };
  }

  return NCM_REDUCOES[n] || NCM_REDUCOES[n.slice(0,7)] || NCM_REDUCOES[n.slice(0,6)] || NCM_REDUCOES[n.slice(0,4)] || null;
};

// Busca redução por código NBS (cNBS da NFS-e). Tenta match exato, depois prefixos
// decrescentes (5 dígitos → 3 dígitos) para acomodar lookups por divisão/grupo.
const getReducaoNBS = (nbs) => {
  if (!nbs) return null;
  const n = nbs.replace(/\D/g, '');
  if (!n) return null;
  return (
    NBS_REDUCOES[n] ||
    NBS_REDUCOES[n.slice(0, 5)] ||
    NBS_REDUCOES[n.slice(0, 3)] ||
    null
  );
};

// Resolve a redução efetiva de um item combinando o discriminador de substâncias
// (NCM_SUBSTANCES_MAP) com a tabela direta de reduções (NCM_REDUCOES/NBS_REDUCOES).
// Sem isso, NCMs ambíguos (capítulos 3002/3004) ficam presos em getReducaoNCM,
// que retorna reducao:0 ("fiscalmente seguro") até serem confirmados — mesmo
// quando o discriminador já sabe (por match literal ou decisão salva) que o
// produto tem redução de 100%.
const resolveReducaoEfetiva = (ncm, xProd, nbs, cached, competenciaAtual, cachedNbs, confirmacoes) => {
  const n = (ncm || '').replace(/\D/g, '').padStart(8, '0');

  // Rejeição manual na Conferência NCM (produto confirmado como "fora do Anexo" pelo
  // usuário) tem prioridade sobre qualquer classificação automática — sem isso, o
  // Confronto IBS/CBS e as demais telas continuavam aplicando a redução mesmo depois
  // do usuário rejeitar o enquadramento.
  if (confirmacoes?.[n] === 'rejected') {
    // Objeto truthy com reducao:0 — precisa ser um objeto (não null) para vencer o
    // fallback `reducaoOverride || getReducaoNCM(...)` em calculateReformImpact;
    // um reduction null seria tratado como "sem info" e cairia de volta na busca
    // automática, reaplicando a redução que acabou de ser rejeitada.
    return {
      reduction: { reducao: 0, tipo: 'Rejeitado', anexo: '—', desc: 'Rejeitado manualmente na Conferência NCM' },
      disc: {
        status: 'FORA_DO_ANEXO', formaConfirmacao: 'manual', substancia: null,
        reducao: null, tipo: null, anexo: null,
        fundamentacao: 'Rejeitado manualmente na Conferência NCM',
        score: 0, candidates: [], motivoFora: 'rejeitado_manual',
      },
    };
  }

  const disc = discriminarNCM(n, xProd || '', cached, competenciaAtual);
  let reduction = null;
  if (disc.status === 'ENQUADRADO') {
    if (disc.formaConfirmacao === 'ncm_direta') {
      reduction = getReducaoNCM(ncm) || getReducaoNBS(nbs);
    } else {
      reduction = disc.reducao != null
        ? { reducao: disc.reducao, tipo: disc.tipo, anexo: disc.anexo, desc: disc.substancia }
        : (getReducaoNCM(ncm) || getReducaoNBS(nbs));
    }
  }

  // Serviço (NFS-e): sem NCM para discriminar — resolve pela tabela de NBS,
  // com fila de revisão (igual ao NCM ambíguo) quando o código não está mapeado.
  if (reduction === null && nbs) {
    reduction = getReducaoNBS(nbs);
    if (!reduction) {
      if (cachedNbs) {
        reduction = { reducao: cachedNbs.reducao, tipo: cachedNbs.tipo, anexo: cachedNbs.anexo, desc: cachedNbs.desc };
      } else {
        reduction = { _ambiguous: true, reducao: 0, tipo: 'Aguardando confirmação', anexo: '—', desc: 'NBS não mapeado — confirme o enquadramento do serviço.' };
      }
    }
  }

  return { reduction, disc };
};

const STORAGE_KEY = 'creditos_ibs_cbs_v1';

// â"€â"€â"€ CÃLCULOS â"€â"€â"€
const calculateRegimeScenario = (productPrice, regimeKey, targetMargin, destUF, senderState, isNFCE, simplesRate = 0) => {
  const originUF = senderState || 'RJ';
  const destinationUF = isNFCE ? originUF : (destUF || 'RJ');
  
  const icmsRate = getICMSRate(originUF, destinationUF);

  const impliedCost = productPrice * (1 - ((simplesRate + targetMargin) / 100));
  const baseCost = impliedCost > 0 ? impliedCost : 0;
  
  if (regimeKey === 'simples-nacional') {
    return { label:'Simples Nacional', taxes:{ 'DAS (Efetivo)': simplesRate }, totalTaxRate: simplesRate, newPrice: productPrice, baseCost, variation: 0 };
  }
  
  let taxes = {};
  const icmsKey = isNFCE ? `ICMS Interno (${originUF})` : `ICMS (${originUF} -> ${destinationUF})`;
  
  if (regimeKey === 'lucro-presumido') {
    taxes = { [icmsKey]: icmsRate, 'PIS': 0.65, 'COFINS': 3.0, 'IRPJ (Ef. 1.2%)': 1.2, 'CSLL (Ef. 1.08%)': 1.08 };
  } else {
    taxes = { [icmsKey]: icmsRate, 'PIS': 0.65, 'COFINS': 3.0, 'IRPJ': targetMargin * 0.15, 'CSLL': targetMargin * 0.09 };
  }
  
  const totalTaxRate = Object.values(taxes).reduce((a, b) => a + b, 0);
  const divisor = 1 - ((totalTaxRate + targetMargin) / 100);
  const newPrice = divisor > 0 ? baseCost / divisor : 0;
  const variation = productPrice > 0 ? ((newPrice - productPrice) / productPrice) * 100 : 0;
  
  return { taxes, totalTaxRate, newPrice, baseCost, variation };
};

// Retorna true apenas para CFOPs de compra real (CMV)
// 1926 (reclassificação de kit) e 2949 (entrada não especificada) ficam fora — não são compras
const isCFOPCompra = (cfop) => {
  if (!cfop) return false;
  const n = parseInt(cfop.trim(), 10);
  if (isNaN(n)) return false;
  return (
    (n >= 1101 && n <= 1130) ||  // compras intraestadual (inclui 1101, 1102, 1111, 1113…)
    (n >= 1401 && n <= 1420) ||  // compras c/ ST intraestadual (1401, 1403…)
    (n >= 1651 && n <= 1655) ||  // compra de combustível/lubrificante (1653)
    (n >= 2101 && n <= 2130) ||  // compras interestadual
    (n >= 2401 && n <= 2420) ||  // compras c/ ST interestadual
    (n >= 3101 && n <= 3103) ||  // importação direta
    (n >= 3201 && n <= 3213) ||  // importação — comercialização
    (n >= 3251 && n <= 3253) ||
    (n >= 3299 && n <= 3303) ||
    (n >= 3350 && n <= 3361) ||
    (n >= 3401 && n <= 3404) ||
    (n >= 3551 && n <= 3554) ||
    (n >= 3651 && n <= 3654)
  );
};

// CFOPs que não geram incidência de CBS/IBS e não representam compra/venda real
// Série 5xxx/6xxx = saídas (remessa)  |  Série 1xxx/2xxx = entradas (retorno/recebimento)
const CFOPS_SEM_INCIDENCIA = new Set([
  // â"€â"€ SAÍDAS (5xxx/6xxx) â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  // Industrialização por encomenda
  '5901','5902','5903','6901','6902','6903',
  // Depósito fechado / armazém geral
  '5905','5906','5907','6905','6906','6907',
  // Comodato
  '5908','5909','6908','6909',
  // Bonificação / doação / brinde / amostra grátis
  '5910','5911','6910','6911',
  // Demonstração / mostruário / treinamento
  '5912','5913','6912','6913',
  // Exposição ou feira
  '5914','6914',
  // Conserto ou reparo
  '5915','5916','6915','6916',
  // Consignação mercantil
  '5917','5918','5919','5920','6917','6918','6919','6920',

  // â"€â"€ ENTRADAS (1xxx/2xxx) — não são compras, não entram no CMV â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  // Retorno de industrialização por encomenda
  '1901','1902','1903','2901','2902','2903',
  // Retorno de depósito fechado / armazém geral
  '1905','1906','1907','2905','2906','2907',
  // Comodato recebido / retorno de comodato
  '1908','1909','2908','2909',
  // Bonificação / amostra grátis recebida
  '1910','1911','2910','2911',
  // Demonstração / mostruário recebido e retorno
  '1912','1913','2912','2913',
  // Exposição ou feira
  '1914','2914',
  // Conserto ou reparo recebido e retorno
  '1915','1916','2915','2916',
  // Consignação mercantil recebida
  '1917','1918','1919','1920','2917','2918','2919','2920',
]);

// CFOPs que NÃƒO representam faturamento real: devoluções e transferências
const isCFOPSemFaturamento = (cfop) => {
  const n = parseInt((cfop || '').replace(/\D/g, ''), 10);
  if (isNaN(n)) return false;
  return (
    (n >= 5200 && n <= 5299) || (n >= 6200 && n <= 6299) || // devoluções de compra (saídas)
    (n >= 5300 && n <= 5399) || (n >= 6300 && n <= 6399) || // transferências (saídas)
    (n >= 1200 && n <= 1299) || (n >= 2200 && n <= 2299) || // devoluções de venda (entradas)
    (n >= 1300 && n <= 1399) || (n >= 2300 && n <= 2399)    // transferências (entradas)
  );
};

// â"€â"€â"€ REFORMA: cálculo corrigido com suporte a entradas â"€â"€â"€
const calculateReformImpact = (
  currentPrice, year, originUF, destUF,
  sellerRegime = 'simples', simplesRate = 0,
  buyerRegime = 'Desconhecido', ncm = '', nbs = '',
  impostoDestacado = null, isEntrada = false,
  cfop = '', xProd = '',
  reducaoOverride = null
) => {
  const rules = REFORM_SCHEDULE[year];
  const icmsCurrentRate = getICMSRate(originUF, destUF);

  let netValue, currentTaxesVal;
  let icmsVal = 0, pisVal = 0, cofinsVal = 0;
  let rateIcmsUsada = icmsCurrentRate;

  if (sellerRegime === 'simples') {
    // Simples Nacional → deduz DAS para chegar no preço limpo
    currentTaxesVal = currentPrice * (simplesRate / 100);
    netValue = currentPrice - currentTaxesVal;

  } else {
    // Regime Normal → usa impostos REAIS da NF se disponíveis
    if (impostoDestacado?.temDados && currentPrice > 0) {
      icmsVal   = impostoDestacado.icms + (impostoDestacado.fcp || 0); // FCP integra carga real
      pisVal    = impostoDestacado.pis;
      cofinsVal = impostoDestacado.cofins;
      rateIcmsUsada = currentPrice > 0 ? (icmsVal / currentPrice) * 100 : icmsCurrentRate;
      // Calcula a alíquota real de ICMS para exibir na memória
      rateIcmsUsada = currentPrice > 0 ? (icmsVal / currentPrice) * 100 : icmsCurrentRate;
    } else {
      // Fallback: estima pelas alíquotas padrão (saídas ou entradas sem dados)
      icmsVal   = currentPrice * (icmsCurrentRate / 100);
      pisVal    = currentPrice * (0.65 / 100);
      cofinsVal = currentPrice * (3.00 / 100);
    }
    currentTaxesVal = icmsVal + pisVal + cofinsVal;
    netValue = currentPrice - currentTaxesVal;
  }

  const reducaoInfo = reducaoOverride || (getReducaoNCM(ncm) || getReducaoNBS(nbs));
  const reducaoPerc = reducaoInfo ? reducaoInfo.reducao : 0;
  const fatorReducao = 1 - (reducaoPerc / 100);

 const isExempt = ['Simples Nacional','MEI','Consumidor Final','Desconhecido'].includes(buyerRegime);
const fornecedorSimples = isEntrada && sellerRegime === 'simples';
const semIncidenciaCFOP = CFOPS_SEM_INCIDENCIA.has((cfop || '').trim());
const effectiveCbsRate = rules.cbs * fatorReducao;
const effectiveIbsRate = rules.ibs * fatorReducao;

// CBS/IBS não incidem quando fornecedor é Simples (entrada) ou CFOP é de remessa/retorno sem incidência
const cbsVal = (fornecedorSimples || semIncidenciaCFOP) ? 0 : netValue * (effectiveCbsRate / 100);
const ibsVal = (fornecedorSimples || semIncidenciaCFOP) ? 0 : netValue * (effectiveIbsRate / 100);
// Se veio dado real da NF e ICMS é zero → respeita (isenção, cesta básica, etc)
const icmsEfetivoRate = (impostoDestacado?.temDados && currentPrice > 0)
  ? (icmsVal / currentPrice) * 100  // alíquota real da NF
  : icmsCurrentRate;                 // fallback padrão

const icmsLegacyVal = fornecedorSimples ? 0
  : (netValue * (icmsEfetivoRate / 100)) * rules.icms_ret;
const futurePrice = netValue + cbsVal + ibsVal + icmsLegacyVal;

// Crédito só para Regime Normal (não para Consumidor Final)
let creditGenerated = 0;
if (isEntrada && sellerRegime === 'normal' && !fornecedorSimples) {
  creditGenerated = cbsVal + ibsVal;
} else if (!isEntrada && buyerRegime === 'Regime Normal') {
  creditGenerated = cbsVal + ibsVal;
}

  return {
    currentPrice, netValue, currentTaxesVal, futurePrice,
    taxes: { cbs: cbsVal, ibs: ibsVal, icmsLegacy: icmsLegacyVal },
    credit: creditGenerated,
    effectiveCost: futurePrice - creditGenerated,
    variation: ((futurePrice - currentPrice) / currentPrice) * 100,
    reducaoInfo, reducaoPerc, fatorReducao, effectiveCbsRate, effectiveIbsRate,
    semIncidenciaCFOP, cfop,
    isEntradaSimples: fornecedorSimples,
    usouDadosReaisNF: sellerRegime === 'normal' && impostoDestacado?.temDados,
    impostosRemovidos: {
      icms: icmsVal,
      pis: pisVal,
      cofins: cofinsVal,
      rateIcms: rateIcmsUsada,
      das: sellerRegime === 'simples' ? currentTaxesVal : 0,
      dasRate: simplesRate
    }
  };
};
// â"€â"€â"€ MAP CONTROLLER â"€â"€â"€
function MapController({ coords }) {
  const map = useMap();
  useEffect(() => { if (coords) map.flyTo(coords, 6, { duration: 2 }); }, [coords, map]);
  return null;
}

// â"€â"€â"€ LINE CHART â"€â"€â"€
const SimpleLineChart = ({ data, dataKey, labelKey, lineColor = '#3b82f6', areaColor = 'rgba(59,130,246,0.1)', formatValue, onDayClick }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  if (!data || data.length === 0) return (
    <div className="flex flex-col items-center justify-center h-64 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm">
      <Activity className="w-6 h-6 mb-2 opacity-50"/> Sem dados
    </div>
  );
  const pts = data.length === 1 ? [data[0], data[0]] : data;
  const maxVal = Math.max(...pts.map(d => d[dataKey])) || 1;
  const getX = i => (i / (pts.length - 1)) * 100;
  const getY = v => 100 - ((v / maxVal) * 80) - 10;
  const points = pts.map((d, i) => `${getX(i)},${getY(d[dataKey])}`).join(' ');
  return (
    <div className="relative h-64 w-full pt-12 pb-4 px-2 select-none" onMouseLeave={() => setActiveIndex(null)}>
      {activeIndex !== null && (
        <div className="absolute z-30 transform -translate-x-1/2 pointer-events-none" style={{ left: `${getX(activeIndex)}%`, top: '-10px' }}>
          <div className="bg-slate-900 text-white rounded-xl shadow-2xl py-2 px-4 flex flex-col items-center min-w-[120px] border border-slate-700">
            <span className="font-bold text-xl whitespace-nowrap leading-none mb-1">{formatValue ? formatValue(pts[activeIndex][dataKey]) : pts[activeIndex][dataKey]}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{pts[activeIndex][labelKey].split('-').slice(1).reverse().join('/')}</span>
            <div className="w-3 h-3 bg-slate-900 rotate-45 absolute -bottom-1.5 border-r border-b border-slate-700"></div>
          </div>
        </div>
      )}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
        {[0,25,50,75,100].map(pos => <line key={pos} x1="0" y1={pos} x2="100" y2={pos} stroke="#f1f5f9" strokeWidth="0.5" vectorEffect="non-scaling-stroke" strokeDasharray="3"/>)}
        <polygon points={`0,100 ${points} 100,100`} fill={areaColor}/>
        <polyline points={points} fill="none" stroke={lineColor} strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"/>
        {activeIndex !== null && <line x1={getX(activeIndex)} y1="0" x2={getX(activeIndex)} y2="100" stroke={lineColor} strokeWidth="1.5" strokeDasharray="4" vectorEffect="non-scaling-stroke" className="opacity-40"/>}
        {pts.map((d, i) => {
          const cx = getX(i), cy = getY(d[dataKey]), isA = i === activeIndex;
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={isA ? 8 : 0} fill={lineColor} className="transition-all duration-200 opacity-20" vectorEffect="non-scaling-stroke"/>
              <circle cx={cx} cy={cy} r={isA ? 5 : 0} fill="white" stroke={lineColor} strokeWidth={isA ? 2.5 : 0} className={`transition-all duration-200 ${isA ? 'opacity-100':'opacity-0'}`} vectorEffect="non-scaling-stroke"/>
              <rect x={i===0?0:getX(i)-(100/pts.length/2)} y="0" width={100/pts.length} height="100" fill="transparent" className="cursor-pointer"
                onMouseEnter={() => setActiveIndex(i)} onClick={() => onDayClick && onDayClick(pts[i])}/>
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-2 px-1 border-t border-slate-100 pt-2">
        <span>{pts[0][labelKey].split('-').slice(1).reverse().join('/')}</span>
        {pts.length > 5 && <span>{pts[Math.floor(pts.length/2)][labelKey].split('-').slice(1).reverse().join('/')}</span>}
        <span>{pts[pts.length-1][labelKey].split('-').slice(1).reverse().join('/')}</span>
      </div>
    </div>
  );
};

// â"€â"€â"€ HOOK DASHBOARD â"€â"€â"€
// Agregação em si mora em report/ingest/dashboardStats.js (função pura,
// compartilhada com a ingestão fiscal do Report Semestral) — aqui só embrulha
// em useMemo pra manter a mesma API pros componentes que já consomem o hook.
const useDashboard = (data, cnpjCache) => useMemo(() => computeDashboardStats(data, cnpjCache), [data, cnpjCache]);

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ABA: CRÉDITOS DE IBS E CBS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

 // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ABA: CRÉDITOS DE IBS E CBS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const REDUCOES_CATEGORIA = {
  // Crédito INTEGRAL
  mercadorias: {
    fator: 1.0,
    reducaoPerc: 0,
    label: 'Mercadorias p/ Revenda — crédito integral'
  },

  insumos: {
    fator: 1.0,
    reducaoPerc: 0,
    label: 'Insumos / Matérias-primas — crédito integral'
  },

  frete_pj: {
    fator: 1.0,
    reducaoPerc: 0,
    label: 'Frete / Transportadora PJ — crédito integral'
  },

  energia: {
    fator: 1.0,
    reducaoPerc: 0,
    label: 'Energia Elétrica — crédito integral'
  },

  telecom: {
    fator: 1.0,
    reducaoPerc: 0,
    label: 'Telecom / Internet — crédito integral'
  },

  servicos_gerais: {
    fator: 1.0,
    reducaoPerc: 0,
    label: 'Serviços Gerais — crédito integral'
  },

  ativo_imobilizado: {
    fator: 1.0,
    reducaoPerc: 0,
    label: 'Ativo Imobilizado — crédito integral'
  },

  software: {
    fator: 1.0,
    reducaoPerc: 0,
    label: 'Software / Cloud — crédito integral'
  },

  vale_refeicao: {
    fator: 1.0,
    reducaoPerc: 0,
    label: 'Vale-Refeição / Alimentação — crédito integral'
  },

  // Crédito PARCIAL 70%
  servicos_liberal: {
    fator: 0.70,
    reducaoPerc: 30,
    label: 'Profissional Liberal — 70%'
  },

  // Crédito PARCIAL 40%
  plano_saude: {
    fator: 0.40,
    reducaoPerc: 60,
    label: 'Plano de Saúde Empresarial — 40%'
  },

  educacao_func: {
    fator: 0.40,
    reducaoPerc: 60,
    label: 'Cursos / Treinamentos — 40%'
  },

  // Crédito PARCIAL 30%
  alugueis: {
    fator: 0.30,
    reducaoPerc: 70,
    label: 'Locação Comercial — 30%'
  },

  // PRESUMIDOS
  frete_autonomo: {
    fator: null,
    reducaoPerc: null,
    label: 'Frete Autônomo PF — presumido'
  },

  compra_usados_pf: {
    fator: null,
    reducaoPerc: null,
    label: 'Compra de usados PF — presumido'
  },
};

const CreditosTab = ({ reformYear }) => {
  const rules = REFORM_SCHEDULE[reformYear] || {};
  const cbsRate = rules.cbs || 0;
  const ibsRate = rules.ibs || 0;

  const getReducaoInfo = (categoria) => {
    return REDUCOES_CATEGORIA[categoria] || null;
  };

  const calcCredito = (valor, categoria) => {
    const info = REDUCOES_CATEGORIA[categoria];
    const fator = info?.fator ?? 1.0;            // null → 0 (crédito presumido)
    const fatorEfetivo = fator === null ? 0 : fator;
    const cbs = valor * (cbsRate / 100) * fatorEfetivo;
    const ibs = valor * (ibsRate / 100) * fatorEfetivo;
    return {
      cbs,
      ibs,
      total: cbs + ibs,
      reducaoAplicada: fatorEfetivo < 1.0,
    };
  };
  // â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const [contas, setContas] = useState([]);
  const [storageReady, setStorageReady] = useState(false);
  const [form, setForm] = useState({ descricao: '', categoria: 'mercadorias', valor: '' });
  const [editId, setEditId] = useState(null);
  const [filterCat, setFilterCat] = useState('TODAS');

  useEffect(() => {
    try { const res = localStorage.getItem(STORAGE_KEY); if (res) setContas(JSON.parse(res)); } catch (_) {}
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(contas)); } catch (_) {}
  }, [contas, storageReady]);

  const handleSave = () => {
    const val = parseFloat(form.valor.replace(',', '.'));
    if (!form.descricao.trim() || isNaN(val) || val <= 0) return;
    if (editId !== null) {
      setContas(prev => prev.map(c => c.id === editId ? { ...c, descricao: form.descricao, categoria: form.categoria, valor: val } : c));
      setEditId(null);
    } else {
      setContas(prev => [...prev, { id: Date.now(), descricao: form.descricao, categoria: form.categoria, valor: val }]);
    }
setForm({ descricao: '', categoria: 'mercadorias', valor: '' });
  };

  const handleEdit = (conta) => { setForm({ descricao: conta.descricao, categoria: conta.categoria, valor: String(conta.valor) }); setEditId(conta.id); };
  const handleDelete = (id) => setContas(prev => prev.filter(c => c.id !== id));
 const handleCancel = () => {
  setForm({ descricao: '', categoria: 'mercadorias', valor: '' });
  setEditId(null);
};

  const contasFiltradas = filterCat === 'TODAS' ? contas : contas.filter(c => c.categoria === filterCat);
  const totais = contas.reduce((acc, c) => { const cr = calcCredito(c.valor, c.categoria); acc.base += c.valor; acc.cbs += cr.cbs; acc.ibs += cr.ibs; acc.total += cr.total; return acc; }, { base: 0, cbs: 0, ibs: 0, total: 0 });
  const totaisFiltrados = contasFiltradas.reduce((acc, c) => { const cr = calcCredito(c.valor, c.categoria); acc.base += c.valor; acc.cbs += cr.cbs; acc.ibs += cr.ibs; acc.total += cr.total; return acc; }, { base: 0, cbs: 0, ibs: 0, total: 0 });
  const previewVal = parseFloat(form.valor.replace(',', '.'));
  const previewOk = !isNaN(previewVal) && previewVal > 0;
  const preview = previewOk ? calcCredito(previewVal, form.categoria) : null;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#222222] to-[#1a1a1a] p-6 rounded-xl text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2"><CheckCircle className="w-6 h-6 text-[#D9C14A]"/>Créditos de IBS e CBS — {reformYear}</h3>
          <p className="text-gray-300 text-sm mt-1">Cadastre as contas que geram crédito. Aluguel tem redução de 70% conforme LC 214/2025.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-center min-w-[90px]">
            <span className="text-[10px] text-gray-300 uppercase font-bold block">CBS</span>
            <span className="text-xl font-black text-white">{cbsRate.toFixed(1)}%</span>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-center min-w-[90px]">
            <span className="text-[10px] text-gray-300 uppercase font-bold block">IBS</span>
            <span className="text-xl font-black text-white">{ibsRate.toFixed(1)}%</span>
          </div>
          <div className="bg-[#D9C14A]/90 border border-slate-300/30 rounded-lg px-4 py-2 text-center min-w-[90px]">
            <span className="text-[10px] text-slate-100 uppercase font-bold block">Alíquota Total</span>
            <span className="text-xl font-black text-white">{(cbsRate + ibsRate).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {contas.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Base Total', valor: totais.base, color: 'text-slate-800', bg: 'bg-white border-slate-200' },
            { label: `Crédito CBS (${cbsRate}%)`, valor: totais.cbs, color: 'text-blue-700', bg: 'bg-gray-50 border-gray-200' },
            { label: `Crédito IBS (${ibsRate}%)`, valor: totais.ibs, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
            { label: 'Crédito Total', valor: totais.total, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-200' },
          ].map(({ label, valor, color, bg }) => (
            <div key={label} className={`${bg} border rounded-xl p-4 shadow-sm`}>
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">{label}</p>
              <p className={`text-xl font-black ${color}`}>R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
        <h4 className="font-bold text-slate-700 text-sm uppercase mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#D9C14A] text-white text-xs flex items-center justify-center font-black">{editId !== null ? '✎' : '+'}</span>
          {editId !== null ? 'Editar Conta' : 'Adicionar Conta'}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descrição da Conta</label>
            <input type="text" placeholder="Ex: Compras de insumos — Fornecedor X" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#D9C14A] focus:border-transparent"/>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Categoria</label>
            <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#D9C14A]">
              {CATEGORIAS_CREDITO.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Valor Base (R$)</label>
            <div className="flex gap-2">
              <input type="text" inputMode="decimal" placeholder="0,00" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleSave()} className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#D9C14A]"/>
              <button onClick={handleSave} className="bg-[#D9C14A] hover:bg-[#B8A030] text-white px-4 rounded-lg font-bold text-sm flex-shrink-0 transition-colors shadow">{editId !== null ? '✓"' : '+'}</button>
              {editId !== null && <button onClick={handleCancel} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 rounded-lg font-bold text-sm flex-shrink-0 transition-colors">✕</button>}
            </div>
          </div>
        </div>

        {preview && (
          <div className="mt-3 flex flex-wrap gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg items-center">
            <span className="text-[10px] font-bold text-emerald-700 uppercase self-center">Preview do Crédito:</span>
            {preview.reducaoAplicada && (() => {
  const info = getReducaoInfo(form.categoria);
  return (
    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded border border-amber-300 font-bold">
      ⚠ {info?.label ?? 'Redução aplicada'} — crédito = {100 - (info?.reducaoPerc ?? 0)}%
    </span>
  );
})()}
            <span className="text-xs bg-gray-100 text-blue-700 px-2 py-1 rounded border border-gray-200 font-bold">CBS: R$ {preview.cbs.toFixed(2)}</span>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded border border-indigo-200 font-bold">IBS: R$ {preview.ibs.toFixed(2)}</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded border border-emerald-300 font-bold">Total: R$ {preview.total.toFixed(2)}</span>
          </div>
        )}
      </div>

      {contas.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Filtrar:</span>
          <button onClick={() => setFilterCat('TODAS')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${filterCat === 'TODAS' ? 'bg-[#222222] text-white border-transparent' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>Todas ({contas.length})</button>
          {CATEGORIAS_CREDITO.filter(cat => contas.some(c => c.categoria === cat.id)).map(cat => {
            const qty = contas.filter(c => c.categoria === cat.id).length;
            const colors = COLOR_MAP[cat.color];
            return (
              <button key={cat.id} onClick={() => setFilterCat(cat.id)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${filterCat === cat.id ? `${colors.bg} ${colors.text} ${colors.border}` : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                {cat.icon} {cat.label} ({qty})
              </button>
            );
          })}
        </div>
      )}

      {contasFiltradas.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-400">
          <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30"/>
          <p className="font-bold">Nenhuma conta cadastrada.</p>
          <p className="text-sm mt-1">Adicione contas acima para visualizar os créditos de IBS e CBS.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="hidden md:grid grid-cols-12 gap-2 px-4 text-[10px] font-bold uppercase text-slate-400">
            <span className="col-span-4">Descrição</span><span className="col-span-2">Categoria</span>
            <span className="col-span-2 text-right">Base (R$)</span><span className="col-span-1 text-right text-blue-500">CBS</span>
            <span className="col-span-1 text-right text-indigo-500">IBS</span><span className="col-span-1 text-right text-emerald-600">Total</span>
            <span className="col-span-1"></span>
          </div>
          {contasFiltradas.map(conta => {
            const cr = calcCredito(conta.valor, conta.categoria);
          const cat = CATEGORIAS_CREDITO.find(c => c.id === conta.categoria) || {
  id: 'desconhecida',
  label: 'Categoria inválida',
  icon: '⚠',
  color: 'slate'
};
           const colors = COLOR_MAP[cat?.color] || COLOR_MAP.slate || {
  badge: 'bg-slate-100 text-slate-700 border-slate-200',
  bg: 'bg-slate-100',
  text: 'text-slate-700',
  border: 'border-slate-200',
};
            const isEd = editId === conta.id;
            return (
              <div key={conta.id} className={`bg-white border rounded-xl p-4 transition-all ${isEd ? 'border-[#D9C14A] ring-1 ring-[#D9C14A] shadow-md' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'}`}>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                  <div className="md:col-span-4">
                    <p className="font-bold text-slate-800 text-sm truncate" title={conta.descricao}>{conta.descricao}</p>
                    {cr.reducaoAplicada && (() => {
  const info = getReducaoInfo(conta.categoria);
  return (
    <p className="text-[9px] text-amber-600 font-bold mt-0.5">
      ⚠ {info?.label ?? 'Redução aplicada'} — crédito = {100 - (info?.reducaoPerc ?? 0)}%
    </p>
  );
})()}
                  </div>
                  <div className="md:col-span-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${colors.badge}`}>{cat?.icon} {cat?.label}</span></div>
                  <div className="md:col-span-2 text-right"><span className="text-sm font-bold text-slate-700">R$ {conta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                  <div className="md:col-span-1 text-right"><span className="text-sm font-bold text-blue-700">R$ {cr.cbs.toFixed(2)}</span></div>
                  <div className="md:col-span-1 text-right"><span className="text-sm font-bold text-indigo-700">R$ {cr.ibs.toFixed(2)}</span></div>
                  <div className="md:col-span-1 text-right"><span className="text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">R$ {cr.total.toFixed(2)}</span></div>
                  <div className="md:col-span-1 flex gap-1 justify-end">
                    <button onClick={() => handleEdit(conta)} className="p-1.5 hover:bg-gray-50 text-blue-500 rounded-lg transition-colors text-xs font-bold">✎</button>
                    <button onClick={() => handleDelete(conta.id)} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg transition-colors text-xs font-bold">✕</button>
                  </div>
                </div>
              </div>
            );
          })}
          {filterCat !== 'TODAS' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-12 gap-2 items-center mt-2">
              <span className="md:col-span-6 text-xs font-bold text-slate-500 uppercase">Subtotal — {CATEGORIAS_CREDITO.find(c => c.id === filterCat)?.label}</span>
              <span className="md:col-span-2 text-right text-sm font-bold text-slate-700">R$ {totaisFiltrados.base.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              <span className="md:col-span-1 text-right text-sm font-bold text-blue-700">R$ {totaisFiltrados.cbs.toFixed(2)}</span>
              <span className="md:col-span-1 text-right text-sm font-bold text-indigo-700">R$ {totaisFiltrados.ibs.toFixed(2)}</span>
              <span className="md:col-span-1 text-right text-sm font-bold text-emerald-700">R$ {totaisFiltrados.total.toFixed(2)}</span>
              <div className="md:col-span-1"></div>
            </div>
          )}
          {filterCat === 'TODAS' && contas.length > 1 && (
            <div className="bg-[#222222] text-white rounded-xl p-4 grid grid-cols-1 md:grid-cols-12 gap-2 items-center mt-2">
              <span className="md:col-span-6 text-xs font-bold uppercase opacity-80">Total Geral — {contas.length} contas</span>
              <span className="md:col-span-2 text-right text-sm font-bold">R$ {totais.base.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              <span className="md:col-span-1 text-right text-sm font-bold text-gray-400">R$ {totais.cbs.toFixed(2)}</span>
              <span className="md:col-span-1 text-right text-sm font-bold text-indigo-300">R$ {totais.ibs.toFixed(2)}</span>
              <span className="md:col-span-1 text-right text-sm font-black text-[#94a3b8]">R$ {totais.total.toFixed(2)}</span>
              <div className="md:col-span-1"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ABA: REFORMA TRIBUTÃRIA
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const ReformTab = memo(({ data, saidasData, entradasData, cnpjCache, setCnpjCache, simplesRate, currentUser, label, empresaRegime, isEntrada, reformYear, setReformYear, getCached: getCachedReform, saveDecision, deleteDecision, clearAllDecisions, loadingNcmDecisoes, getCachedNbs, saveDecisionNbs, loadingNbsDecisoes, ncmConfirmacoes, setNcmConfirmacoes, segmentosSimples, rbt12RawSimples }) => {
  const [subTab, setSubTab] = useState('notas');
  const [expandedInvoice, setExpandedInvoice] = useState(null);
  const [expandedInvoiceItem, setExpandedInvoiceItem] = useState(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState(0);
  const [selectedCompetence, setSelectedCompetence] = useState('TODAS');
  const [docTipoFiltro, setDocTipoFiltro] = useState('todas'); // 'todas' | 'venda' | 'servico'
  const cnpj = currentUser?.licenseCNPJ;

  const competenceIndex = useMemo(() => {
    const idx = new Map();
    data.forEach(item => {
      if (!item.date) return;
      const d = new Date(item.date);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (!idx.has(key)) idx.set(key, []);
      idx.get(key).push(item);
    });
    return idx;
  }, [data]);

  const availableCompetences = useMemo(() => (
    Array.from(competenceIndex.keys()).sort().reverse()
  ), [competenceIndex]);

  const filteredData = useMemo(() => (
    selectedCompetence === 'TODAS' ? data : (competenceIndex.get(selectedCompetence) ?? [])
  ), [data, selectedCompetence, competenceIndex]);

  const tipoFilteredData = useMemo(() => {
    if (docTipoFiltro === 'servico') return filteredData.filter(i => i.tipoDoc === 'NFSe');
    if (docTipoFiltro === 'venda') return filteredData.filter(i => i.tipoDoc !== 'NFSe');
    return filteredData;
  }, [filteredData, docTipoFiltro]);

  const groupedInvoices = useMemo(() => {
    const groups = {};
    tipoFilteredData.forEach(item => {
      const k = `${item.tipoDoc || 'NFe'}_${item.peerCNPJ || ''}_${item.nNF || 'S/N'}`;
      if (!groups[k]) groups[k] = { nNF: item.nNF || 'S/N', tipoDoc: item.tipoDoc || 'NFe', peerNome: item.peerNome, peerCNPJ: item.peerCNPJ, peerUF: item.peerUF, emitUF: item.emitUF, date: item.date, items: [], totalValue: 0 };
      groups[k].items.push(item);
      groups[k].totalValue += item.prodValTotal;
    });
    return Object.values(groups).sort((a,b) => b.totalValue - a.totalValue);
  }, [tipoFilteredData]);

  const PAGE_SIZE = 50;
  const [page, setPage] = useState(0);
  useEffect(() => { setPage(0); setExpandedInvoice(null); }, [selectedCompetence, subTab, docTipoFiltro]);

  const enrichedInvoices = useMemo(() =>
    groupedInvoices.map(invoice => {
      const peerCNPJClean = invoice.peerCNPJ ? cleanCNPJ(invoice.peerCNPJ) : null;
      const peerRegime = peerCNPJClean ? (cnpjCache[peerCNPJClean] || 'Desconhecido') : 'Desconhecido';
      const originStateDisplay = isEntrada ? (invoice.peerUF || 'RJ') : (invoice.emitUF || 'RJ');
      const destStateDisplay   = isEntrada ? (invoice.emitUF || 'RJ') : (invoice.peerUF || 'RJ');
      return {
        ...invoice,
        peerRegime,
        sellerRegimeNorm: isEntrada ? (peerRegime === 'Regime Normal' ? 'normal' : 'simples') : empresaRegime,
        originStateDisplay,
        destStateDisplay,
        icmsInterest: getICMSRate(originStateDisplay, destStateDisplay),
      };
    }), [groupedInvoices, cnpjCache, isEntrada, empresaRegime]);

  const pagedInvoices = useMemo(() =>
    enrichedInvoices.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [enrichedInvoices, page]);
  const totalPages = Math.ceil(enrichedInvoices.length / PAGE_SIZE);

  const totalVendas = useMemo(() =>
    enrichedInvoices.reduce((sum, inv) => sum + inv.totalValue, 0),
    [enrichedInvoices]);

  const uniqueCNPJsPendentes = useMemo(() => {
    const todos = [...new Set(tipoFilteredData.map(i => cleanCNPJ(i.peerCNPJ)).filter(c => c && c.length === 14 && c !== '00000000000000'))];
    return todos.filter(cnpj => !cnpjCache[cnpj] || cnpjCache[cnpj].includes('Erro')).length;
  }, [tipoFilteredData, cnpjCache]);

  const dash = useDashboard(tipoFilteredData, cnpjCache);

  const toggleInvoiceItem = (nNF, idx) => {
    const k = `${nNF}-${idx}`;
    setExpandedInvoiceItem(prev => prev === k ? null : k);
  };

  const enrichCustomerData = async () => {
    if (tipoFilteredData.length === 0) return;
    setIsEnriching(true); setEnrichProgress(0);
    const uniqueCNPJs = [...new Set(tipoFilteredData.map(i => cleanCNPJ(i.peerCNPJ)).filter(c => c && c.length === 14 && c !== '00000000000000'))].filter(cnpj => !cnpjCache[cnpj] || cnpjCache[cnpj].includes('Erro'));
    if (uniqueCNPJs.length === 0) { alert('Todos os CNPJs já foram consultados!'); setIsEnriching(false); return; }
    let sucessos = 0;
    const buffer = {};
    for (let i = 0; i < uniqueCNPJs.length; i++) {
      const cnpj = uniqueCNPJs[i];
      try {
       const response = await fetch('https://analisador-cnpj-api.onrender.com/consultar-unico', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cnpj }) });
        if (response.ok) {
          const d = await response.json();
          buffer[d.cnpj] = d.regime;
          if (i % 10 === 0) setCnpjCache(prev => ({ ...prev, ...buffer }));
          if (d.status === 'sucesso') sucessos++;
          if (d.origem === 'cache') { await new Promise(r => setTimeout(r, 50)); } else { setEnrichProgress(-1); await new Promise(r => setTimeout(r, 21000)); }
        } else { await new Promise(r => setTimeout(r, 5000)); }
      } catch (error) { console.error(`Erro ao consultar ${cnpj}:`, error); }
      setEnrichProgress(Math.round(((i + 1) / uniqueCNPJs.length) * 100));
    }
    setCnpjCache(prev => ({ ...prev, ...buffer }));
    setIsEnriching(false);
    alert(`Processo finalizado! ${sucessos}/${uniqueCNPJs.length} CNPJs atualizados.`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#222222] flex items-center gap-2"><List className="w-6 h-6 text-[#D9C14A]"/> Reforma Tributária — {label}</h2>
          <p className="text-slate-500 text-sm mt-1">Visualize cada nota, o regime da contraparte e o cálculo detalhado por item.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg shadow-sm">
            <Calendar className="w-4 h-4 text-slate-500"/>
            <span className="text-xs font-bold text-slate-700 uppercase">Ano Base:</span>
          <select value={reformYear} onChange={e => setReformYear(e.target.value)} className="bg-transparent font-bold text-slate-800 outline-none text-sm cursor-pointer">
  {Object.keys(REFORM_SCHEDULE).sort().map(y => <option key={y} value={y}>{y}</option>)}
</select>
          </div>
          <div className="flex flex-col items-end gap-1">
            <button onClick={enrichCustomerData} disabled={isEnriching}
              className={`px-4 py-2 rounded-lg text-xs font-bold text-white shadow-md flex items-center gap-2 ${isEnriching ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
              <RefreshCw className={`w-4 h-4 ${isEnriching ? 'animate-spin' : ''}`}/>
              {isEnriching
                ? (enrichProgress === -1 ? 'Respeitando API (20s)...' : `Processando... ${enrichProgress}%`)
                : uniqueCNPJsPendentes > 0
                  ? `Atualizar Regimes — ${uniqueCNPJsPendentes} CNPJs pendentes`
                  : 'Regimes atualizados ✓"'}
            </button>
            <span className="text-[10px] text-slate-400 font-medium">Processa todos os CNPJs de todas as páginas</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200 px-2">
        {[
          { id: 'notas',       label: 'Visão por Notas',        icon: FileText,    activeClass: 'border-[#D9C14A] text-[#222222]' },
          { id: 'conferencia', label: 'Conferência NCM',         icon: CheckCircle, activeClass: 'border-amber-500 text-amber-700' },
          { id: 'reducoes',    label: 'Top Reduções (NCM)',      icon: TrendingUp,  activeClass: 'border-emerald-500 text-emerald-700' },
        ].map(({ id, label, icon: Icon, activeClass }) => (
          <button key={id} onClick={() => setSubTab(id)}
            className={`pb-2 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${subTab === id ? activeClass : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            <Icon className="w-4 h-4"/> {label}
          </button>
        ))}
      </div>

      {subTab === 'notas' ? (
        data.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <List className="w-10 h-10 mx-auto mb-3 opacity-30"/>
            <p className="font-bold">Nenhum dado de {label} carregado.</p>
            <p className="text-sm mt-1">Importe XMLs no módulo de Precificação → Processamento em Lote.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-[#222222] p-2 rounded-lg text-white"><Filter className="w-4 h-4"/></div>
                <span className="text-sm font-bold text-slate-700">{selectedCompetence === 'TODAS' ? 'Todo o Período' : selectedCompetence}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setSelectedCompetence('TODAS')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${selectedCompetence==='TODAS'?'bg-[#222222] text-white border-transparent':'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>TODAS</button>
                {availableCompetences.map(comp => (
                  <button key={comp} onClick={() => setSelectedCompetence(comp)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${selectedCompetence===comp?'bg-[#222222] text-white border-transparent':'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{comp}</button>
                ))}
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-violet-600 p-2 rounded-lg text-white"><Briefcase className="w-4 h-4"/></div>
                <span className="text-sm font-bold text-slate-700">Tipo de Documento</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'todas',   label: 'Todas' },
                  { id: 'venda',   label: 'Vendas' },
                  { id: 'servico', label: 'Serviços' },
                ].map(({ id, label: chipLabel }) => (
                  <button key={id} onClick={() => setDocTipoFiltro(id)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${docTipoFiltro===id?'bg-violet-600 text-white border-transparent':'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{chipLabel}</button>
                ))}
              </div>
            </div>

            {enrichedInvoices.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#222222] p-4 rounded-xl shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-full text-white"><DollarSign className="w-6 h-6"/></div>
                  <div>
                    <p className="text-xs text-white/60 uppercase font-bold">{enrichedInvoices.length} Notas — Total Geral</p>
                    <p className="text-xl font-bold text-white">R$ {totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 rounded-full text-emerald-600"><CheckCircle className="w-6 h-6"/></div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Simples Nacional</p>
                    <p className="text-xl font-bold text-emerald-700">R$ {dash.regimeStats['Simples Nacional'].toLocaleString('pt-BR', { notation: 'compact' })}</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-gray-100 rounded-full text-blue-600"><Briefcase className="w-6 h-6"/></div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Regime Normal</p>
                    <p className="text-xl font-bold text-blue-700">R$ {dash.regimeStats['Regime Normal'].toLocaleString('pt-BR', { notation: 'compact' })}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {enrichedInvoices.length === 0 ? (
                <div className="text-center py-10 text-slate-400">Nenhuma nota encontrada neste período.</div>
              ) : pagedInvoices.map((invoice, idx) => {
                const isExpanded = expandedInvoice === invoice.nNF;
                const { peerRegime, sellerRegimeNorm, originStateDisplay, destStateDisplay, icmsInterest } = invoice;

                return (
                  <div key={idx} className={`bg-white rounded-xl shadow-sm border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-[#222222] ring-1 ring-[#222222]' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div className="p-5 flex flex-col md:flex-row items-center justify-between cursor-pointer bg-slate-50 hover:bg-white transition-colors" onClick={() => setExpandedInvoice(isExpanded ? null : invoice.nNF)}>
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className={`p-3 rounded-full ${isExpanded ? 'bg-[#222222] text-white' : 'bg-white border border-slate-200 text-slate-400'}`}><FileText className="w-5 h-5"/></div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            {invoice.tipoDoc === 'NFSe' ? 'NFS-e:' : 'Nota Fiscal:'} {invoice.nNF}
                            {invoice.tipoDoc === 'NFSe' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200 uppercase">Serviços</span>}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span>{invoice.peerNome}</span>
                            <span className="text-xs bg-slate-200 px-1.5 py-0.5 rounded">{invoice.peerCNPJ}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 mt-4 md:mt-0">
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600">
                          <MapPin className="w-3 h-3 text-slate-400"/>
                          <span>{originStateDisplay}</span>
                          <span className="text-slate-300 mx-0.5">→</span>
                          <span>{destStateDisplay}</span>
                        </div>
                        {peerRegime !== 'Desconhecido' && (
                          <span className={`text-[10px] px-2 py-1 rounded border uppercase font-bold tracking-wide ${peerRegime === 'Regime Normal' ? 'bg-gray-100 text-blue-700 border-gray-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>{peerRegime}</span>
                        )}
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Valor Total</span>
                          <div className="text-xl font-bold text-[#222222]">R$ {invoice.totalValue.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div>
                        </div>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400"/> : <ChevronDown className="w-5 h-5 text-slate-400"/>}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-200 p-4 bg-white">
                        <div className="mb-3 flex justify-between items-center">
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 font-bold">
                            {isEntrada
                              ? (sellerRegimeNorm === 'normal' ? '✓" Regime Normal — créditos da NF utilizados' : '⚠ Simples Nacional — sem crédito de IBS/CBS')
                              : 'Saída — cálculo de débito'}
                          </span>
                          <span className="text-[10px] bg-slate-50 text-slate-500 px-2 py-1 rounded border border-slate-100 font-bold">Simulando regra de: {reformYear}</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                              <tr>
                                <th className="px-4 py-3 w-full">Produto / NCM</th>
                                <th className="px-4 py-3 text-right whitespace-nowrap">Qtd</th>
                                <th className="px-4 py-3 text-right whitespace-nowrap">V. Unit Original</th>
                                <th className="px-4 py-3 text-right whitespace-nowrap bg-slate-100">V. Unit Limpo</th>
                                <th className="px-4 py-3 text-right whitespace-nowrap text-blue-700">Preço {reformYear}</th>
                                <th className="px-4 py-3 text-right whitespace-nowrap text-emerald-700">{isEntrada ? 'Crédito' : 'Débito'}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {invoice.items.map((item, iIdx) => {
                               const calcUnit = (item.prodValTotal && item.prodQty) ? (item.prodValTotal / item.prodQty) : item.prodValUnit;

const originState = isEntrada ? (invoice.peerUF || 'RJ') : (item.emitUF || 'RJ');
const destState = isEntrada ? (item.emitUF || 'RJ') : (invoice.peerUF || 'RJ');

// Normaliza impostos para valor UNITÃRIO (XML traz totais da linha)
const qty = item.prodQty || 1;
const impostoUnit = item.impostoDestacado?.temDados
  ? {
      icms:      item.impostoDestacado.icms    / qty,
      fcp:       (item.impostoDestacado.fcp   || 0) / qty,
      pis:       item.impostoDestacado.pis     / qty,
      cofins:    item.impostoDestacado.cofins  / qty,
      ibs:       (item.impostoDestacado.ibs   || 0) / qty,
      cbs:       (item.impostoDestacado.cbs   || 0) / qty,
      total:     item.impostoDestacado.total   / qty,
      temDados:  true,
      temIBSCBS: item.impostoDestacado.temIBSCBS,
    }
  : (item.impostoDestacado || null);

const ncmNorm = (item.prodNCM || '').replace(/\D/g, '').padStart(8, '0');
const { reduction } = resolveReducaoEfetiva(item.prodNCM, item.prodNome, item.prodNBS, getCachedReform(cnpj, ncmNorm, item.prodNome || '', null), null, getCachedNbs(cnpj, (item.prodNBS || '').replace(/\D/g, '')), ncmConfirmacoes);
const impact = calculateReformImpact(
  calcUnit, reformYear, originState, destState,
  sellerRegimeNorm, simplesRate,
  isEntrada ? empresaRegime : peerRegime,
  item.prodNCM || '', item.prodNBS || '',
  impostoUnit,
  isEntrada,
  item.prodCFOP || '', item.prodNome || '', reduction
);

// Venda por empresa do Simples: reconstrói o preço a partir do preço limpo
// (Preço Limpo + DAS Por Fora dos demais tributos + CBS/IBS à parte) — mesma
// sistemática usada na Precificação. O futurePrice padrão de calculateReformImpact
// soma só CBS/IBS ao preço limpo e ignora o restante do DAS (IRPJ/CSLL/CPP/ISS/ICMS),
// fazendo parecer que o preço quase não muda.
const isVendaSimples = !isEntrada && sellerRegimeNorm === 'simples';
let dasPorForaInfo = null;
let precoNovoExibido = impact.futurePrice;
if (isVendaSimples) {
  const { rate: dasPorForaRate, anexo: anexoDasFora, configurado: dasForaConfigurado } =
    calcDasPorForaRate(reformYear, item.tipoDoc === 'NFSe', segmentosSimples, rbt12RawSimples, simplesRate);
  const dasPorForaValor = impact.netValue * dasPorForaRate;
  precoNovoExibido = impact.netValue + dasPorForaValor + impact.taxes.cbs + impact.taxes.ibs;
  dasPorForaInfo = { dasPorForaRate, anexoDasFora, dasForaConfigurado, dasPorForaValor };
}
                                const isItemExp = expandedInvoiceItem === `${invoice.nNF}-${iIdx}`;
                                return (
                                  <React.Fragment key={iIdx}>
                                    <tr className={`hover:bg-slate-50 cursor-pointer transition-colors ${isItemExp ? 'bg-slate-50' : ''}`} onClick={() => toggleInvoiceItem(invoice.nNF, iIdx)}>
                                      <td className="px-4 py-3 font-medium text-slate-700">
                                        <div className="flex items-start gap-2">
                                          {isItemExp ? <ChevronUp className="w-3 h-3 text-slate-400 mt-1 flex-shrink-0"/> : <ChevronDown className="w-3 h-3 text-slate-400 mt-1 flex-shrink-0"/>}
                                          <div>
                                            <div>{item.prodNome}</div>
                                            {item.tipoDoc === 'NFSe'
                                              ? <div className="text-[10px] text-slate-400 mt-0.5">NBS: {item.prodNBS || '—'} · Serviço</div>
                                              : <div className="text-[10px] text-slate-400 mt-0.5">NCM: {item.prodNCM}</div>
                                            }
                                            {impact.reducaoInfo && !impact.reducaoInfo._ambiguous && (
                                              <div className="flex items-center gap-1 mt-1 flex-wrap">
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase flex-shrink-0 ${impact.reducaoInfo.reducao === 100 ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-gray-100 text-blue-700 border-gray-300'}`}>
                                                  {impact.reducaoInfo.reducao === 100 ? '✓" Alíquota Zero' : `↓ ${impact.reducaoInfo.reducao}% redução`}
                                                </span>
                                                <span className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-bold flex-shrink-0">{impact.reducaoInfo.anexo}</span>
                                              </div>
                                            )}
                                            {impact.reducaoInfo?._ambiguous && (
                                              <div className="flex items-center gap-1 mt-1">
                                                <span className="text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase flex-shrink-0 bg-amber-100 text-amber-700 border-amber-300">
                                                  {item.tipoDoc === 'NFSe'
                                                    ? '⚠ NBS não mapeado — confirmar na aba Conferência'
                                                    : '⚠ NCM ambígua — confirmar na aba Insights'}
                                                </span>
                                              </div>
                                            )}
                                            {impact.semIncidenciaCFOP && (
                                              <div className="flex items-center gap-1 mt-1">
                                                <span className="text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase flex-shrink-0 bg-slate-100 text-slate-600 border-slate-300">
                                                  ⊘ CFOP {impact.cfop} — sem incidência CBS/IBS
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-right whitespace-nowrap text-slate-600">{smartNumber(item.prodQty, item.prodUnit)}</td>
                                      <td className="px-4 py-3 text-right whitespace-nowrap text-slate-600">R$ {calcUnit.toFixed(2)}</td>
                                      <td className="px-4 py-3 text-right whitespace-nowrap font-bold text-slate-700 bg-slate-50">R$ {impact.netValue.toFixed(2)}</td>
                                      <td className="px-4 py-3 text-right whitespace-nowrap font-bold text-blue-700">R$ {precoNovoExibido.toFixed(2)}</td>
                                      <td className="px-4 py-3 text-right whitespace-nowrap font-bold text-emerald-600">{impact.credit > 0 ? `R$ ${impact.credit.toFixed(2)}` : '-'}</td>
                                    </tr>
                                  {isItemExp && (
                                      <tr>
                                        <td colSpan={6} className="p-0 border-b border-slate-100">
                                          <div className="bg-slate-50 p-6 border-l-4 border-[#D9C14A]">
                                            <div className="flex items-center gap-2 mb-4">
                                              <Calculator className="w-4 h-4 text-[#D9C14A]"/>
                                              <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Memória de Cálculo ({reformYear})</h4>
                                            </div>
                                            <div className="grid md:grid-cols-3 gap-8 text-xs">
                                             {/* 1. Preço Limpo */}
<div className="space-y-2">
  <strong className="text-slate-500 uppercase block border-b pb-1 mb-2">1. Preço Limpo</strong>
  <div className="flex justify-between"><span>Original:</span><span>R$ {impact.currentPrice.toFixed(2)}</span></div>
  {sellerRegimeNorm === 'simples' ? (
    <div className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 rounded p-2 mt-1">
      DAS ({simplesRate}%): - R$ {impact.impostosRemovidos.das.toFixed(2)}
    </div>
  ) : (
    <div className="text-[10px] space-y-1 bg-slate-100 rounded p-2 border border-slate-200 mt-1">
      {impact.usouDadosReaisNF && (
        <div className="text-[9px] text-blue-600 font-bold mb-1 flex items-center gap-1">
          ✓" Valores reais da NF
        </div>
      )}
      <div className="flex justify-between text-slate-500">
        <span>ICMS ({impact.impostosRemovidos.rateIcms.toFixed(1)}%):</span>
        <span>- R$ {impact.impostosRemovidos.icms.toFixed(2)}</span>
      </div>
      {(impostoUnit?.fcp > 0) && (
  <div className="flex justify-between text-slate-500">
    <span>FCP (NF):</span>
    <span>- R$ {impostoUnit.fcp.toFixed(2)}</span>
  </div>
)}
<div className="flex justify-between text-slate-500">
  <span>PIS{impact.usouDadosReaisNF ? ' (NF)' : ' (0.65%)'}:</span>
  <span>- R$ {impact.impostosRemovidos.pis.toFixed(2)}</span>
</div>
<div className="flex justify-between text-slate-500">
  <span>COFINS{impact.usouDadosReaisNF ? ' (NF)' : ' (3.00%)'}:</span>
  <span>- R$ {impact.impostosRemovidos.cofins.toFixed(2)}</span>
</div>
    </div>
  )}
  <div className="flex justify-between font-bold pt-1 border-t"><span>(=) Base:</span><span>R$ {impact.netValue.toFixed(2)}</span></div>
</div>
                                              {/* 2. Novos Impostos */}
                                              {/* 2. Novos Impostos */}
                                           <div className="space-y-2">
<strong className="text-blue-600 uppercase block border-b pb-1 mb-2">2. Novos Impostos</strong>
<div className="flex justify-between text-slate-500 text-[10px] mb-1">
  <span>Base (Preço Limpo):</span>
  <span>R$ {impact.netValue.toFixed(2)}</span>
</div>
{impact.reducaoInfo && !impact.reducaoInfo._ambiguous && impact.reducaoPerc > 0 && (
  <div className="text-[9px] bg-gray-50 text-blue-700 border border-gray-200 rounded px-2 py-1 mb-2 font-bold">
    ↓ Redução {impact.reducaoPerc}% incide na alíquota — base permanece integral
  </div>
)}
<div className="flex justify-between">
  <span>(+) CBS ({impact.effectiveCbsRate.toFixed(2)}%):</span>
  <span>+ R$ {impact.taxes.cbs.toFixed(2)}</span>
</div>
<div className="flex justify-between">
  <span>(+) IBS ({impact.effectiveIbsRate.toFixed(2)}%):</span>
  <span>+ R$ {impact.taxes.ibs.toFixed(2)}</span>
</div>
                                            {isVendaSimples ? (
                                              <div className="flex justify-between text-indigo-700">
                                                <span>(+) DAS Por Fora — Anexo {dasPorForaInfo.anexoDasFora} ({(dasPorForaInfo.dasPorForaRate * 100).toFixed(2)}%):</span>
                                                <span>+ R$ {dasPorForaInfo.dasPorForaValor.toFixed(2)}</span>
                                              </div>
                                            ) : impact.taxes.icmsLegacy > 0 && (
                                                  <div className="flex justify-between text-slate-500">
                                                    <span>(+) ICMS Transição ({icmsInterest}%):</span>
                                                    <span>+ R$ {impact.taxes.icmsLegacy.toFixed(2)}</span>
                                                </div>
                                                )}
                                            {isVendaSimples && !dasPorForaInfo.dasForaConfigurado && (
                                              <div className="text-[9px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-1">
                                                RBT12 não configurado na aba Simples Nacional — usando a alíquota de hoje como aproximação.
                                              </div>
                                            )}
                                        <div className="flex justify-between font-bold pt-1 border-t text-blue-700"><span>(=) Novo Preço:</span><span>R$ {precoNovoExibido.toFixed(2)}</span></div>
</div>
{/* 3. Crédito */}
<div className="space-y-2">
  <strong className="text-emerald-600 uppercase block border-b pb-1 mb-2">
    3. {isEntrada ? 'Crédito Recuperável' : 'Visão Cliente'}
  </strong>

  {impact.isEntradaSimples ? (
    // Fornecedor Simples → sem crédito
    <div className="text-slate-400 italic text-center py-2 text-xs">
      Simples Nacional — sem crédito de ICMS/PIS/COFINS.
    </div>

 ) : isEntrada && sellerRegimeNorm === 'normal' && impact.credit > 0 ? (
    <div className="bg-emerald-100 border border-emerald-200 text-emerald-800 p-2 rounded text-center">
      <span className="block font-bold text-lg">R$ {impact.credit.toFixed(2)}</span>
      <span className="text-[9px] uppercase font-bold">Crédito de IBS/CBS</span>
    </div>

) : !isEntrada && peerRegime === 'Regime Normal' && impact.credit > 0 ? (
    <div className="bg-emerald-100 border border-emerald-200 text-emerald-800 p-2 rounded text-center">
      <span className="block font-bold text-lg">R$ {impact.credit.toFixed(2)}</span>
      <span className="text-[9px] uppercase font-bold">Crédito de IBS/CBS</span>
    </div>

  ) : (
    <div className="text-slate-400 italic text-center py-2 text-xs">Sem crédito.</div>
  )}
</div>
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                  <span className="text-xs text-slate-500 font-bold">
                    Notas {page * PAGE_SIZE + 1}—{Math.min((page + 1) * PAGE_SIZE, enrichedInvoices.length)} de {enrichedInvoices.length}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors">
                      ← Anterior
                    </button>
                    <span className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-lg border border-slate-200">
                      {page + 1} / {totalPages}
                    </span>
                    <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors">
                      Próxima →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      ) : (
       subTab === 'conferencia'
         ? <ConferenciaNCMTab saidasData={saidasData} entradasData={entradasData} cnpj={currentUser?.licenseCNPJ} usuario={currentUser?.name || currentUser?.username || 'desconhecido'} getCached={getCachedReform} saveDecision={saveDecision} deleteDecision={deleteDecision} clearAllDecisions={clearAllDecisions} loadingNcmDecisoes={loadingNcmDecisoes} getCachedNbs={getCachedNbs} saveDecisionNbs={saveDecisionNbs} loadingNbsDecisoes={loadingNbsDecisoes} confirmacoes={ncmConfirmacoes} setConfirmacoes={setNcmConfirmacoes}/>
         : <ReductionInsightsTab saidasData={saidasData} entradasData={entradasData} simplesRate={simplesRate} reformYear={reformYear} empresaRegime={empresaRegime} cnpj={currentUser?.licenseCNPJ} getCached={getCachedReform} getCachedNbs={getCachedNbs} ncmConfirmacoes={ncmConfirmacoes}/>
      )}
    </div>
  );
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ABA: VISÃƒO GERAL DA OPERAÇÃƒO
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const PRECIF_ANEXOS_SERVICO = new Set(['anexo3', 'anexo4', 'anexo5']);

// DAS "Por Fora": alíquota efetiva dos tributos do Simples Nacional que NÃO são
// IBS/CBS (IRPJ/CSLL/CPP/ISS/ICMS) — usada para reconstruir o preço de venda quando
// a empresa opta por apurar "por fora" (IBS/CBS recolhidos separados, fora da guia).
// Reaproveita a configuração já feita na aba Simples Nacional (RBT12 + Anexo do
// segmento correspondente); sem RBT12/segmento configurado, cai para a alíquota de
// hoje como aproximação. Usado tanto na Precificação quanto em Visão por Notas.
const calcDasPorForaRate = (reformYear, isServico, segmentosSimples, rbt12RawSimples, aliquotaFallback) => {
  const anoTabela = SIMPLES_DB[reformYear] ? reformYear : Object.keys(SIMPLES_DB).sort().reverse().find(a => a <= reformYear) || '2027';
  const segMatch = (segmentosSimples || []).find(s => PRECIF_ANEXOS_SERVICO.has(s.anexo) === isServico);
  const anexo = segMatch?.anexo || (isServico ? 'anexo3' : 'anexo1');
  const tab = SIMPLES_DB[anoTabela]?.[anexo];
  const rbt12 = parseFloat((rbt12RawSimples || '0').replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  const configurado = rbt12 > 0 && !!tab;

  if (!configurado) {
    return { rate: (aliquotaFallback || 0) / 100, anexo, configurado };
  }
  const fi = tab.faixas.findIndex(f => rbt12 <= f.limite);
  const faixa = tab.faixas[fi >= 0 ? fi : tab.faixas.length - 1];
  const aliqEf = (rbt12 * faixa.nominal - faixa.deducao) / rbt12;
  const ibsIdx = tab.tributos.indexOf('IBS');
  const cbsIdx = tab.tributos.indexOf('CBS');
  const repSemIBSCBS = tab.tributos.reduce((acc, nome, i) => (i === ibsIdx || i === cbsIdx) ? acc : acc + (faixa.rep[i] || 0), 0);
  return { rate: aliqEf * repSemIBSCBS, anexo, configurado };
};

const PrecificacaoTab = memo(({ saidasData, empresaRegime, simplesRate, reformYear, cnpj, getCached, getCachedNbs, ncmConfirmacoes, segmentosSimples, rbt12RawSimples }) => {
  const [busca, setBusca] = useState('');
  const [selecionado, setSelecionado] = useState(null);
  const [apuracao, setApuracao] = useState('fora'); // 'dentro' | 'fora'
  // Empresa pode ter comércio/indústria e serviços juntos — cada um pode cair em
  // Anexo/alíquota efetiva diferente no Simples Nacional, então a alíquota do DAS
  // usada para "limpar" o preço precisa ser separada por tipo, não uma só global.
  const [aliquotaVendas, setAliquotaVendas] = useState(simplesRate ? String(simplesRate) : '');
  const [aliquotaServicos, setAliquotaServicos] = useState(simplesRate ? String(simplesRate) : '');

  const produtos = useMemo(() => {
    const mapa = new Map();
    saidasData.forEach(item => {
      if (!item.prodNome) return;
      const key = `${item.tipoDoc || 'NFe'}_${item.prodNome}`;
      const atual = mapa.get(key);
      if (!atual || (item.date || '') > (atual.date || '')) mapa.set(key, item);
    });
    return Array.from(mapa.values()).sort((a, b) => (a.prodNome || '').localeCompare(b.prodNome || ''));
  }, [saidasData]);

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return produtos;
    return produtos.filter(p => (p.prodNome || '').toLowerCase().includes(termo));
  }, [produtos, busca]);

  const fmtR = v => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (empresaRegime !== 'simples') {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
        <Tag className="w-10 h-10 mx-auto mb-3 opacity-30"/>
        <p className="font-bold">Simulador de Precificação — Simples Nacional</p>
        <p className="text-sm mt-1">Este simulador compara o preço de venda nas apurações "Por Dentro" e "Por Fora" do Simples Nacional. Faça login como empresa do Simples Nacional para usá-lo.</p>
      </div>
    );
  }

  if (produtos.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
        <Tag className="w-10 h-10 mx-auto mb-3 opacity-30"/>
        <p className="font-bold">Nenhum produto/serviço de saída carregado.</p>
        <p className="text-sm mt-1">Importe XMLs de saída para simular a precificação.</p>
      </div>
    );
  }

  const calcUnit = selecionado
    ? ((selecionado.prodValTotal && selecionado.prodQty) ? selecionado.prodValTotal / selecionado.prodQty : selecionado.prodValUnit)
    : 0;

  const isServico = selecionado?.tipoDoc === 'NFSe';
  const aliquotaAtiva = parseFloat((isServico ? aliquotaServicos : aliquotaVendas).replace(',', '.')) || 0;

  const ncmNorm = selecionado ? (selecionado.prodNCM || '').replace(/\D/g, '').padStart(8, '0') : '';
  const nbsNorm = selecionado ? (selecionado.prodNBS || '').replace(/\D/g, '') : '';
  const { reduction } = selecionado
    ? resolveReducaoEfetiva(selecionado.prodNCM, selecionado.prodNome, selecionado.prodNBS, getCached(cnpj, ncmNorm, selecionado.prodNome || '', null), null, getCachedNbs(cnpj, nbsNorm), ncmConfirmacoes)
    : { reduction: null };

  const impact = selecionado
    ? calculateReformImpact(
        calcUnit, reformYear, selecionado.emitUF || 'RJ', selecionado.peerUF || 'RJ',
        'simples', aliquotaAtiva, 'Desconhecido',
        selecionado.prodNCM || '', selecionado.prodNBS || '', null, false,
        selecionado.prodCFOP || '', selecionado.prodNome || '', reduction
      )
    : null;

  // Preço limpo de hoje: preço atual menos a alíquota do DAS. É a partir dele que
  // os dois cenários de apuração reconstroem o preço novo (embutindo o tributo de
  // volta "por dentro", ou somando CBS/IBS "por fora").
  const dasHoje = calcUnit * (aliquotaAtiva / 100);
  const precoLimpo = calcUnit - dasHoje;

  // DAS "Por Fora": reaproveita a configuração já feita na aba Simples Nacional
  // (RBT12 + Anexo do segmento correspondente). Sem isso, o preço novo ficava
  // contando só o CBS/IBS e esquecendo o resto do DAS.
  const { rate: dasPorForaRate, anexo: anexoEscolhido, configurado: rbt12Configurado } =
    calcDasPorForaRate(reformYear, isServico, segmentosSimples, rbt12RawSimples, aliquotaAtiva);
  const dasPorFora = precoLimpo * dasPorForaRate;
  const cbsPorFora = impact?.taxes?.cbs || 0;
  const ibsPorFora = impact?.taxes?.ibs || 0;
  const precoNovoPorFora = precoLimpo + dasPorFora + cbsPorFora + ibsPorFora;
  const variacaoPorFora = calcUnit > 0 ? ((precoNovoPorFora - calcUnit) / calcUnit) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-[#222222] flex items-center gap-2"><Tag className="w-6 h-6 text-[#D9C14A]"/> Precificação — Reforma Tributária</h2>
        <p className="text-slate-500 text-sm mt-1">Escolha um produto ou serviço e veja como o preço fica em cada tipo de apuração do Simples Nacional.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <p className="text-[10px] font-bold text-slate-500 uppercase mb-3">Alíquota do DAS hoje — por tipo de receita</p>
        <p className="text-xs text-slate-400 mb-3 -mt-2">
          Comércio/indústria e serviços podem cair em Anexos diferentes do Simples Nacional, com alíquotas efetivas
          diferentes — por isso são configuradas separadamente aqui, em vez de usar uma única alíquota para tudo.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-3 rounded-lg border ${!isServico && selecionado ? 'border-[#D9C14A] bg-amber-50/40' : 'border-slate-200 bg-slate-50'}`}>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Vendas (Comércio/Indústria) %</label>
            <div className="flex items-center gap-2">
              <input type="number" step="0.01" min="0" max="33" value={aliquotaVendas}
                onChange={e => setAliquotaVendas(e.target.value)}
                className="w-full text-lg font-bold text-slate-800 bg-transparent border-none outline-none focus:ring-0"/>
              <span className="text-slate-400 font-bold">%</span>
            </div>
          </div>
          <div className={`p-3 rounded-lg border ${isServico ? 'border-[#D9C14A] bg-amber-50/40' : 'border-slate-200 bg-slate-50'}`}>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Serviços %</label>
            <div className="flex items-center gap-2">
              <input type="number" step="0.01" min="0" max="33" value={aliquotaServicos}
                onChange={e => setAliquotaServicos(e.target.value)}
                className="w-full text-lg font-bold text-slate-800 bg-transparent border-none outline-none focus:ring-0"/>
              <span className="text-slate-400 font-bold">%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Buscar Produto / Serviço</label>
        <input
          type="text" value={busca}
          onChange={e => { setBusca(e.target.value); setSelecionado(null); }}
          placeholder="Digite o nome do produto ou serviço..."
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#222222] font-medium text-slate-700"
        />
        {!selecionado && produtosFiltrados.length > 0 && (
          <div className="mt-3 divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
            {produtosFiltrados.map(p => {
              const unit = (p.prodValTotal && p.prodQty) ? p.prodValTotal / p.prodQty : p.prodValUnit;
              return (
                <button key={`${p.tipoDoc || 'NFe'}_${p.prodNome}`} onClick={() => setSelecionado(p)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{p.prodNome}</p>
                    <p className="text-[10px] text-slate-400">{p.tipoDoc === 'NFSe' ? `NBS: ${p.prodNBS || '—'} · Serviço` : `NCM: ${p.prodNCM || '—'}`}</p>
                  </div>
                  <span className="text-sm font-bold text-slate-600 shrink-0">R$ {unit.toFixed(2)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selecionado && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">{selecionado.prodNome}</h3>
              <p className="text-xs text-slate-400">{selecionado.tipoDoc === 'NFSe' ? `NBS: ${selecionado.prodNBS || '—'} · Serviço` : `NCM: ${selecionado.prodNCM || '—'}`}</p>
            </div>
            <button onClick={() => setSelecionado(null)} className="text-xs text-slate-400 hover:text-slate-600 font-bold underline">Trocar produto</button>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
            <button onClick={() => setApuracao('dentro')}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${apuracao === 'dentro' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
              Apuração Por Dentro
            </button>
            <button onClick={() => setApuracao('fora')}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${apuracao === 'fora' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
              Apuração Por Fora
            </button>
          </div>

          {apuracao === 'dentro' ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-emerald-600"/>
                <span className="font-bold text-emerald-800">Preço não muda</span>
              </div>
              <p className="text-sm text-emerald-700 mb-4">
                Na apuração "Por Dentro", o IBS/CBS ficam embutidos na mesma guia (DAS), na mesma alíquota efetiva de hoje.
                O cliente não é cobrado separadamente — o preço parte do mesmo preço limpo de hoje e volta a embutir o
                tributo (agora já com IBS/CBS dentro), resultando no mesmo preço de venda.
              </p>
              <div className="space-y-2 text-sm mb-5">
                <div className="flex justify-between"><span className="text-slate-500">Preço Atual</span><span className="font-bold text-slate-700">{fmtR(calcUnit)}</span></div>
                <div className="flex justify-between text-amber-700"><span>(–) DAS de hoje ({aliquotaAtiva}%)</span><span>- {fmtR(dasHoje)}</span></div>
                <div className="flex justify-between border-t border-emerald-200 pt-2"><span className="font-bold text-slate-600">Preço Limpo</span><span className="font-bold text-slate-700">{fmtR(precoLimpo)}</span></div>
                <div className="flex justify-between text-emerald-700"><span>(+) DAS reconstituído ({aliquotaAtiva}%, já com IBS/CBS embutidos)</span><span>+ {fmtR(dasHoje)}</span></div>
              </div>
              <div className="flex items-center gap-8 pt-4 border-t border-emerald-200">
                <div>
                  <p className="text-[10px] text-emerald-600 uppercase font-bold">Preço Atual</p>
                  <p className="text-2xl font-black text-emerald-800">{fmtR(calcUnit)}</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-emerald-300 rotate-0"/>
                <div>
                  <p className="text-[10px] text-emerald-600 uppercase font-bold">Preço Novo ({reformYear})</p>
                  <p className="text-2xl font-black text-emerald-800">{fmtR(calcUnit)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Calculator className="w-5 h-5 text-blue-600"/>
                <span className="font-bold text-blue-800">Composição do novo preço</span>
                {reduction && !reduction._ambiguous && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase ${reduction.reducao === 100 ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-gray-100 text-blue-700 border-gray-300'}`}>
                    {reduction.reducao === 100 ? 'Alíquota Zero' : `↓ ${reduction.reducao}% redução`} — {reduction.anexo}
                  </span>
                )}
                {reduction?._ambiguous && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase bg-amber-100 text-amber-700 border-amber-300">
                    {selecionado.tipoDoc === 'NFSe' ? '⚠ NBS não mapeado — confirmar na aba Conferência' : '⚠ NCM ambígua — confirmar na aba Insights'}
                  </span>
                )}
              </div>
              {!rbt12Configurado && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mb-3">
                  RBT12 não configurado para o Anexo "{anexoEscolhido}" na aba Simples Nacional — usando a alíquota de hoje
                  ({aliquotaAtiva}%) como aproximação para o DAS Por Fora. Configure lá para um cálculo mais preciso.
                </p>
              )}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Preço Atual</span><span className="font-bold text-slate-700">{fmtR(calcUnit)}</span></div>
                <div className="flex justify-between text-amber-700"><span>(–) DAS de hoje ({aliquotaAtiva}%)</span><span>- {fmtR(dasHoje)}</span></div>
                <div className="flex justify-between border-t border-blue-200 pt-2"><span className="font-bold text-slate-600">Preço Limpo</span><span className="font-bold text-slate-700">{fmtR(precoLimpo)}</span></div>
                <div className="flex justify-between text-indigo-700"><span>(+) DAS Por Fora — Anexo {anexoEscolhido} ({(dasPorForaRate * 100).toFixed(2)}%, sem IBS/CBS)</span><span>+ {fmtR(dasPorFora)}</span></div>
                <div className="flex justify-between text-blue-700"><span>(+) CBS efetivo (à parte)</span><span>+ {fmtR(cbsPorFora)}</span></div>
                <div className="flex justify-between text-blue-700"><span>(+) IBS efetivo (à parte)</span><span>+ {fmtR(ibsPorFora)}</span></div>
              </div>
              <div className="flex items-center gap-8 mt-5 pt-4 border-t border-blue-200">
                <div>
                  <p className="text-[10px] text-blue-600 uppercase font-bold">Preço Atual</p>
                  <p className="text-2xl font-black text-blue-900">{fmtR(calcUnit)}</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-blue-300"/>
                <div>
                  <p className="text-[10px] text-blue-600 uppercase font-bold">Preço Novo ({reformYear})</p>
                  <p className="text-2xl font-black text-blue-900">{fmtR(precoNovoPorFora)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-blue-600 uppercase font-bold">Variação</p>
                  <p className="text-2xl font-black text-blue-900">{variacaoPorFora.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

const VisaoGeralTab = memo(({ saidasData, entradasData, cnpjCache }) => {
  const [selectedCompetence, setSelectedCompetence] = useState('TODAS');
  const [mapFocus, setMapFocus] = useState(null);

  const competencias = useMemo(() => {
    const s = new Set();
    [...saidasData, ...entradasData].forEach(item => {
      if (item.date) {
        const d = new Date(item.date);
        if (!isNaN(d)) s.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
      }
    });
    return Array.from(s).sort().reverse();
  }, [saidasData, entradasData]);

  const filtrarComp = (lista) => {
    if (selectedCompetence === 'TODAS') return lista;
    return lista.filter(item => {
      if (!item.date) return false;
      const d = new Date(item.date);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` === selectedCompetence;
    });
  };

  const saidasFiltradas = useMemo(() => filtrarComp(saidasData), [saidasData, selectedCompetence]);
  const entradasFiltradas = useMemo(() => filtrarComp(entradasData), [entradasData, selectedCompetence]);

  const dashSaidas = useDashboard(saidasFiltradas, cnpjCache);
  const dashEntradas = useDashboard(entradasFiltradas, cnpjCache);

  const pagamentosSaidas = useMemo(() => {
    const mapa = {};
    saidasFiltradas.forEach(item => {
      const forma = item.formaPagamento || 'Não Informado';
      mapa[forma] = (mapa[forma] || 0) + (item.prodValTotal || 0);
    });
    return Object.entries(mapa).sort((a, b) => b[1] - a[1]);
  }, [saidasFiltradas]);
  const totalPagamentosSaidas = useMemo(() => pagamentosSaidas.reduce((s, [, v]) => s + v, 0), [pagamentosSaidas]);

  const maxMapVal = useMemo(() =>
    Math.max(...Object.values(dashSaidas.mapStats).map(d => d.value), 1),
    [dashSaidas]
  );

  if (saidasData.length === 0 && entradasData.length === 0) {
    return (
      <div className="text-center py-24 text-slate-400">
        <Activity className="w-12 h-12 mx-auto mb-4 opacity-30"/>
        <p className="font-bold text-slate-600">Nenhuma nota importada.</p>
        <p className="text-sm mt-1">Importe XMLs de saída e/ou entrada para ver o painel da operação.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Filtro competência */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-[#222222] p-2 rounded-lg text-white"><Filter className="w-4 h-4"/></div>
          <span className="text-sm font-bold text-slate-700">{selectedCompetence === 'TODAS' ? 'Todo o Período' : selectedCompetence}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSelectedCompetence('TODAS')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${selectedCompetence==='TODAS'?'bg-[#222222] text-white border-transparent':'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
            TODO O PERÍODO
          </button>
          {competencias.map(c => (
            <button key={c} onClick={() => setSelectedCompetence(c)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${selectedCompetence===c?'bg-[#222222] text-white border-transparent':'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Cards totais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border-2 border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="w-4 h-4 text-[#D9C14A]"/>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Faturamento Saídas</span>
          </div>
          <div className="text-2xl font-black text-slate-800">
            R$ {dashSaidas.totalRevenue.toLocaleString('pt-BR',{notation:'compact',maximumFractionDigits:1})}
          </div>
          <div className="text-xs text-slate-400 mt-1">{saidasFiltradas.length} itens · {dashSaidas.clientsByRevenue.length} clientes</div>
        </div>
        <div className="bg-white rounded-xl border-2 border-emerald-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="w-4 h-4 text-emerald-600"/>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Volume Compras</span>
          </div>
          <div className="text-2xl font-black text-slate-800">
            R$ {dashEntradas.totalRevenue.toLocaleString('pt-BR',{notation:'compact',maximumFractionDigits:1})}
          </div>
          <div className="text-xs text-slate-400 mt-1">{entradasFiltradas.length} itens · {dashEntradas.clientsByRevenue.length} fornecedores</div>
        </div>
        <div className="bg-white rounded-xl border-2 border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-slate-500"/>
            <span className="text-[10px] font-bold text-slate-400 uppercase">SKUs Vendidos</span>
          </div>
          <div className="text-2xl font-black text-slate-800">{dashSaidas.uniqueProducts}</div>
          <div className="text-xs text-slate-400 mt-1">produtos distintos em saídas</div>
        </div>
        <div className="bg-white rounded-xl border-2 border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-slate-500"/>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Margem Bruta Est.</span>
          </div>
          <div className={`text-2xl font-black ${dashSaidas.totalRevenue > 0 ? 'text-slate-800' : 'text-slate-300'}`}>
            {dashSaidas.totalRevenue > 0 && dashEntradas.totalRevenue > 0
              ? `${(((dashSaidas.totalRevenue - dashEntradas.totalRevenue) / dashSaidas.totalRevenue) * 100).toFixed(1)}%`
              : '—'}
          </div>
          <div className="text-xs text-slate-400 mt-1">(saídas − entradas) / saídas</div>
        </div>
      </div>

      {/* Mapa + Maiores clientes */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-base font-bold text-[#222222] flex items-center gap-2 mb-5 border-b border-slate-100 pb-3">
          <MapIcon className="w-5 h-5 text-[#D9C14A]"/> Distribuição Geográfica de Vendas
        </h3>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 h-[500px] bg-slate-100 rounded-xl overflow-hidden border border-slate-300 z-0 shadow-inner">
            <MapContainer center={[-14.235,-51.925]} zoom={4} style={{height:'100%',width:'100%'}}>
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"/>
              <MapController coords={mapFocus}/>
              {Object.entries(dashSaidas.mapStats).map(([uf, d]) => {
                if (!d.value) return null;
                const coords = STATE_COORDINATES[uf];
                if (!coords) return null;
                return (
                  <CircleMarker key={uf} center={coords}
                    pathOptions={{ color:'#222222', fillColor:'#D9C14A', fillOpacity:0.8, weight:1 }}
                    radius={Math.max((d.value/maxMapVal)*50, 12)}>
                    <Tooltip direction="top" offset={[0,-8]} opacity={1}>
                      <div className="text-center min-w-[100px]">
                        <strong className="text-base block border-b border-slate-100 pb-1 mb-1">{uf}</strong>
                        <div className="text-xs text-slate-500 font-bold">R$ {d.value.toLocaleString('pt-BR',{notation:'compact'})}</div>
                        <div className="text-[10px] text-slate-400">{d.count} NFs</div>
                      </div>
                    </Tooltip>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
          <div className="w-full md:w-72 flex-shrink-0">
            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-[#D9C14A]"/> Maiores Clientes
            </h4>
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {dashSaidas.clientsByRevenue.slice(0,15).map((c, i) => (
                <div key={i}
                  className="bg-slate-50 border border-slate-200 p-3 rounded-lg cursor-pointer hover:shadow-sm transition-all"
                  onClick={() => STATE_COORDINATES[c.uf] && setMapFocus(STATE_COORDINATES[c.uf])}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800 text-xs truncate w-40" title={c.name}>{c.name}</span>
                    <span className="text-xs font-bold text-[#D9C14A]">{c.uf}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 truncate">{c.cnpj}</span>
                    <span className="font-bold text-slate-700 text-xs ml-2 flex-shrink-0">R$ {c.revenue.toLocaleString('pt-BR',{notation:'compact'})}</span>
                  </div>
                  {c.topProduct && c.topProduct !== 'N/A' && (
                    <div className="mt-1.5 text-[10px] text-slate-500 flex items-center gap-1 truncate">
                      <Star className="w-3 h-3 text-[#D9C14A] fill-current flex-shrink-0"/>
                      <span className="truncate">{c.topProduct}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Produtos mais vendidos + Itens mais comprados + Maiores fornecedores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-[#222222] flex items-center gap-2 mb-4 text-base border-b border-slate-100 pb-3">
            <Package className="w-5 h-5 text-[#D9C14A]"/> Produtos Mais Vendidos
          </h3>
          <div className="space-y-1">
            {dashSaidas.productsByRevenue.slice(0,12).map((p, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                <span className="text-slate-300 text-xs font-bold w-6 text-right flex-shrink-0">{i+1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-800 truncate" title={p.name}>{p.name}</div>
                  <div className="text-[10px] text-slate-400">{p.qty.toFixed(0)} un.</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-slate-700">R$ {p.revenue.toLocaleString('pt-BR',{notation:'compact'})}</div>
                  <div className={`text-[10px] font-bold ${p.classification==='A'?'text-emerald-600':p.classification==='B'?'text-blue-500':'text-slate-400'}`}>
                    Curva {p.classification}
                  </div>
                </div>
              </div>
            ))}
            {dashSaidas.productsByRevenue.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">Nenhum produto nas saídas.</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-[#222222] flex items-center gap-2 mb-4 text-base border-b border-slate-100 pb-3">
            <ShoppingCart className="w-5 h-5 text-emerald-600"/> Itens Mais Comprados
          </h3>
          <div className="space-y-1">
            {dashEntradas.productsByRevenue.slice(0,12).map((p, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                <span className="text-slate-300 text-xs font-bold w-6 text-right flex-shrink-0">{i+1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-800 truncate" title={p.name}>{p.name}</div>
                  <div className="text-[10px] text-slate-400">{p.qty.toFixed(0)} un.</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-slate-700">R$ {p.revenue.toLocaleString('pt-BR',{notation:'compact'})}</div>
                </div>
              </div>
            ))}
            {dashEntradas.productsByRevenue.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">Nenhum item nas entradas.</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-[#222222] flex items-center gap-2 mb-4 text-base border-b border-slate-100 pb-3">
            <Building2 className="w-5 h-5 text-emerald-600"/> Maiores Fornecedores
          </h3>
          <div className="space-y-1">
            {dashEntradas.clientsByRevenue.slice(0,12).map((f, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                <span className="text-slate-300 text-xs font-bold w-6 text-right flex-shrink-0">{i+1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-800 truncate" title={f.name}>{f.name}</div>
                  <div className="text-[10px] text-slate-400">{f.cnpj} · {f.uf}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-slate-700">R$ {f.revenue.toLocaleString('pt-BR',{notation:'compact'})}</div>
                  {f.regime && f.regime !== 'Desconhecido' && (
                    <div className={`text-[10px] font-bold ${f.regime==='Simples Nacional'?'text-emerald-600':'text-blue-500'}`}>
                      {f.regime.replace('Regime ','')}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {dashEntradas.clientsByRevenue.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">Nenhum fornecedor nas entradas.</p>
            )}
          </div>
        </div>

      </div>

      {/* CFOPs de saída e entrada */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-[#222222] flex items-center gap-2 mb-4 text-base border-b border-slate-100 pb-3">
            <FileText className="w-5 h-5 text-[#D9C14A]"/> CFOPs — Saídas
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {dashSaidas.cfopsByRevenue.map((c, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="flex justify-between items-start mb-1.5">
                  <span className="bg-gray-100 text-[#222222] font-bold px-2 py-0.5 rounded text-xs">{c.code}</span>
                  <span className="text-[10px] text-slate-400">{c.count} ops</span>
                </div>
                <div className="text-sm font-bold text-slate-800">R$ {c.revenue.toLocaleString('pt-BR',{notation:'compact'})}</div>
              </div>
            ))}
            {dashSaidas.cfopsByRevenue.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6 col-span-2">Nenhum CFOP nas saídas.</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-[#222222] flex items-center gap-2 mb-4 text-base border-b border-slate-100 pb-3">
            <FileText className="w-5 h-5 text-emerald-600"/> CFOPs — Entradas
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {dashEntradas.cfopsByRevenue.map((c, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="flex justify-between items-start mb-1.5">
                  <span className="bg-gray-100 text-[#222222] font-bold px-2 py-0.5 rounded text-xs">{c.code}</span>
                  <span className="text-[10px] text-slate-400">{c.count} ops</span>
                </div>
                <div className="text-sm font-bold text-slate-800">R$ {c.revenue.toLocaleString('pt-BR',{notation:'compact'})}</div>
              </div>
            ))}
            {dashEntradas.cfopsByRevenue.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6 col-span-2">Nenhum CFOP nas entradas.</p>
            )}
          </div>
        </div>
      </div>

      {/* Forma de pagamento — só nas saídas, é onde o XML costuma trazer o dado */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-[#222222] flex items-center gap-2 mb-4 text-base border-b border-slate-100 pb-3">
          <DollarSign className="w-5 h-5 text-[#D9C14A]"/> Formas de Pagamento — Saídas
        </h3>
        <div className="space-y-3">
          {pagamentosSaidas.map(([forma, valor], i) => {
            const pct = totalPagamentosSaidas > 0 ? (valor / totalPagamentosSaidas) * 100 : 0;
            return (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-600">{forma}</span>
                  <span className="font-bold text-slate-700">R$ {valor.toLocaleString('pt-BR',{notation:'compact'})} · {pct.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-[#D9C14A] h-2 rounded-full" style={{ width: `${pct}%` }}/>
                </div>
              </div>
            );
          })}
          {pagamentosSaidas.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">Nenhuma forma de pagamento registrada nas saídas.</p>
          )}
        </div>
      </div>
    </div>
  );
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ABA: DASHBOARD BI + MAPA
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const DashboardTab = memo(({ data, cnpjCache, accentColor, mapColor, isSaida, onGerarDemo, isBatchProcessing }) => {
  const [mapFocus, setMapFocus] = useState(null);
  const [selectedCompetence, setSelectedCompetence] = useState('TODAS');
  const competenceIndex = useMemo(() => {
    const idx = new Map();
    data.forEach(item => {
      if (!item.date) return;
      const d = new Date(item.date);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (!idx.has(key)) idx.set(key, []);
      idx.get(key).push(item);
    });
    return idx;
  }, [data]);

  const availableCompetences = useMemo(() => (
    Array.from(competenceIndex.keys()).sort().reverse()
  ), [competenceIndex]);

  const filteredData = useMemo(() => (
    selectedCompetence === 'TODAS' ? data : (competenceIndex.get(selectedCompetence) ?? [])
  ), [data, selectedCompetence, competenceIndex]);
  const dash = useDashboard(filteredData, cnpjCache);
  const maxVal = useMemo(() => Math.max(...Object.values(dash.mapStats).map(d => d.value), 1), [dash]);
  const peerLabel = isSaida ? 'Clientes' : 'Fornecedores';
  if (data.length === 0) return <EmptyState onGerarDemo={onGerarDemo} isBatchProcessing={isBatchProcessing}/>;
  return (
    <div className="space-y-6">
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3"><div className="bg-[#222222] p-2 rounded-lg text-white"><Filter className="w-4 h-4"/></div><span className="text-sm font-bold text-slate-700">{selectedCompetence === 'TODAS' ? 'Todo o Período' : selectedCompetence}</span></div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSelectedCompetence('TODAS')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${selectedCompetence==='TODAS'?'bg-[#222222] text-white border-transparent':'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>TODAS</button>
          {availableCompetences.map(comp => (<button key={comp} onClick={() => setSelectedCompetence(comp)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${selectedCompetence===comp?'bg-[#222222] text-white border-transparent':'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{comp}</button>))}
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
          <h2 className="text-xl font-bold text-[#222222] flex items-center gap-2"><MapIcon className="w-5 h-5" style={{color: accentColor}}/> Dashboard Geográfico</h2>
          <div className="bg-slate-50 border border-slate-200 px-6 py-2 rounded-lg text-right">
            <div className="text-[10px] text-slate-500 font-bold uppercase">{isSaida ? 'Faturamento' : 'Volume de Compras'}</div>
            <span className="text-2xl font-bold text-[#222222]">R$ {dash.totalRevenue.toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 h-[550px] bg-slate-100 rounded-xl overflow-hidden border border-slate-300 z-0 relative shadow-inner">
            <MapContainer center={[-14.235,-51.925]} zoom={4} style={{height:'100%',width:'100%'}}>
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"/>
              <MapController coords={mapFocus}/>
              {Object.entries(dash.mapStats).map(([uf, d]) => {
                if (d.value === 0) return null;
                const coords = STATE_COORDINATES[uf];
                if (!coords) return null;
                return (
                  <CircleMarker key={uf} center={coords} pathOptions={{ color:'#222222', fillColor: mapColor, fillOpacity:0.8, weight:1 }} radius={Math.max((d.value/maxVal)*50,15)}>
                    <Tooltip direction="top" offset={[0,-10]} opacity={1}>
                      <div className="text-center min-w-[100px]">
                        <strong className="text-lg text-slate-900 block border-b border-slate-100 pb-1 mb-1">{uf}</strong>
                        <div className="text-xs text-slate-500 font-bold uppercase">Volume</div>
                        <div className="font-bold text-slate-800 text-lg">R$ {d.value.toLocaleString('pt-BR',{notation:'compact'})}</div>
                        <div className="text-[10px] text-slate-400 mt-1">{d.count} NFs</div>
                      </div>
                    </Tooltip>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
          <div className="w-full md:w-80 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4 uppercase text-xs tracking-wider"><Briefcase className="w-4 h-4" style={{color: accentColor}}/> {peerLabel}</h3>
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
              {dash.clientsByRevenue.slice(0,15).map((client, idx) => (
                <div key={idx} className="flex flex-col bg-slate-50 p-3 rounded-lg border border-slate-200 cursor-pointer hover:shadow-md transition-all gap-2 group" onClick={() => { if(STATE_COORDINATES[client.uf]) setMapFocus(STATE_COORDINATES[client.uf]); }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 text-xs truncate w-40" title={client.name}>{client.name}</div>
                      <div className="text-[10px] text-slate-500">{client.cnpj} • <span className="font-bold" style={{color: accentColor}}>{client.uf}</span></div>
                      {client.regime && client.regime !== 'Desconhecido' && (<div className={`mt-1 inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${client.regime === 'Simples Nacional' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-blue-700 border-gray-200'}`}>{client.regime}</div>)}
                    </div>
                    <div className="font-bold text-slate-700 text-xs">R$ {client.revenue.toLocaleString('pt-BR',{notation:'compact'})}</div>
                  </div>
               {client.topProduct && (
                    <div className="pt-2 border-t border-slate-200 flex items-center gap-2 text-[10px]">
                      <Star className="w-3 h-3 text-[#D9C14A] fill-current"/>
                      <span className="truncate text-slate-600">
                        <span className="font-bold text-slate-800">Destaque:</span> {client.topProduct}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 bg-slate-50 p-5 rounded-xl border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText className="w-5 h-5" style={{color: accentColor}}/> Resumo de CFOPs</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dash.cfopsByRevenue.map((cfop, idx) => (
              <div key={idx} className="bg-white p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                <div className="flex justify-between items-start mb-2"><span className="bg-gray-100 text-[#222222] font-bold px-2 py-1 rounded text-sm">{cfop.code}</span><span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-200">{cfop.count} ops</span></div>
                <div className="text-2xl font-bold text-slate-800">R$ {cfop.revenue.toLocaleString('pt-BR',{notation:'compact'})}</div>
                <div className="text-xs text-slate-500 mt-1">Total Movimentado</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ABA: PRODUTOS / COMPRAS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const ProductsTab = ({ data, cnpjCache, accentColor, lineColor, isSaida, onGerarDemo, isBatchProcessing }) => {
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedDayMapFocus, setSelectedDayMapFocus] = useState(null);
  const [selectedCompetence, setSelectedCompetence] = useState('TODAS');
  const [selectedPair, setSelectedPair] = useState(null);
  const operLabel = isSaida ? 'Vendas' : 'Compras';
  const peerLabel = isSaida ? 'Clientes' : 'Fornecedores';
  const valorChartLabel = isSaida ? 'Valor por Dia (R$)' : 'Compras por Dia (R$)';
  const volChartLabel = isSaida ? 'Volume por Dia (Qtd)' : 'Volume Comprado por Dia (Qtd)';
  const competenceIndex = useMemo(() => {
    const idx = new Map();
    data.forEach(item => {
      if (!item.date) return;
      const d = new Date(item.date);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (!idx.has(key)) idx.set(key, []);
      idx.get(key).push(item);
    });
    return idx;
  }, [data]);

  const availableCompetences = useMemo(() => (
    Array.from(competenceIndex.keys()).sort().reverse()
  ), [competenceIndex]);

  const filteredData = useMemo(() => (
    selectedCompetence === 'TODAS' ? data : (competenceIndex.get(selectedCompetence) ?? [])
  ), [data, selectedCompetence, competenceIndex]);
  const dash = useDashboard(filteredData, cnpjCache);
  const selectedDayData = useMemo(() => {
    if (!selectedDay) return null;
    const ops = filteredData.filter(item => item.date.split('T')[0] === selectedDay.date);
    const peerGroups = {};
    ops.forEach(item => {
      const k = item.peerCNPJ || 'Desconhecido';
      if (!peerGroups[k]) peerGroups[k] = { cnpj: k, name: item.peerNome, uf: item.peerUF, products: [], totalValue: 0 };
      peerGroups[k].products.push(item);
      peerGroups[k].totalValue += item.prodValTotal;
    });
    const states = [...new Set(ops.map(i => i.peerUF))].filter(uf => STATE_COORDINATES[uf]);
    return { date: selectedDay.date, totalValue: selectedDay.value, totalQty: selectedDay.qty, peers: Object.values(peerGroups).sort((a,b) => b.totalValue - a.totalValue), states };
  }, [selectedDay, filteredData]);
  useEffect(() => { if (selectedDayData?.states?.length > 0) setSelectedDayMapFocus(STATE_COORDINATES[selectedDayData.states[0]]); }, [selectedDayData]);
  if (data.length === 0) return <EmptyState onGerarDemo={onGerarDemo} isBatchProcessing={isBatchProcessing}/>;
  return (
    <div className="space-y-6">
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3"><div className="bg-[#222222] p-2 rounded-lg text-white"><Filter className="w-4 h-4"/></div><span className="text-sm font-bold text-slate-700">{selectedCompetence === 'TODAS' ? 'Todo o Período' : selectedCompetence}</span></div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSelectedCompetence('TODAS')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${selectedCompetence==='TODAS'?'bg-[#222222] text-white border-transparent':'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>TODAS</button>
          {availableCompetences.map(comp => (<button key={comp} onClick={() => setSelectedCompetence(comp)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${selectedCompetence===comp?'bg-[#222222] text-white border-transparent':'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{comp}</button>))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm" style={{borderTopWidth:'4px', borderTopColor: accentColor}}>
          <div className="flex items-center gap-3 mb-2"><div className="bg-slate-100 p-2 rounded-lg"><Package className="w-5 h-5" style={{color: accentColor}}/></div><span className="text-sm font-bold text-slate-500 uppercase">Mix de Produtos</span></div>
          <div className="text-3xl font-bold text-slate-800">{dash.uniqueProducts} <span className="text-sm font-normal text-slate-400">SKUs</span></div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-t-4 border-[#222222]">
          <div className="flex items-center gap-3 mb-2"><div className="bg-gray-50 p-2 rounded-lg"><Layers className="w-5 h-5 text-blue-600"/></div><span className="text-sm font-bold text-slate-500 uppercase">Volume Físico</span></div>
          <div className="text-3xl font-bold text-slate-800">{smartNumber(dash.totalQty,'un')} <span className="text-sm font-normal text-slate-400">Un.</span></div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-t-4 border-emerald-500">
          <div className="flex items-center gap-3 mb-2"><div className="bg-emerald-50 p-2 rounded-lg"><DollarSign className="w-5 h-5 text-emerald-600"/></div><span className="text-sm font-bold text-slate-500 uppercase">{isSaida ? 'Ticket Médio' : 'Custo Médio'}</span></div>
          <div className="text-3xl font-bold text-slate-800">R$ {(dash.totalRevenue/(dash.totalQty||1)).toLocaleString('pt-BR',{minimumFractionDigits:2})}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity className="w-5 h-5" style={{color: lineColor}}/> {valorChartLabel}<span className="text-[10px] text-slate-400 ml-1">clique para detalhar</span></h3>
          <SimpleLineChart data={dash.dailyChartData} dataKey="value" labelKey="date" lineColor={lineColor} areaColor={lineColor + '22'} formatValue={v => `R$ ${v.toLocaleString('pt-BR',{notation:'compact'})}`} onDayClick={setSelectedDay}/>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Layers className="w-5 h-5 text-blue-600"/> {volChartLabel}</h3>
          <SimpleLineChart data={dash.dailyChartData} dataKey="qty" labelKey="date" lineColor="#3b82f6" areaColor="rgba(59,130,246,0.1)" formatValue={v => smartNumber(v,'un')} onDayClick={setSelectedDay}/>
        </div>
      </div>
      {selectedDayData && (
        <div className="p-6 rounded-xl border-2 shadow-lg bg-slate-50" style={{borderColor: accentColor + '66'}}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Calendar className="w-5 h-5" style={{color: accentColor}}/> {selectedDayData.date.split('-').reverse().join('/')}</h3>
              <div className="flex gap-6 mt-3">
                <div><span className="text-xs text-slate-600 uppercase font-bold block">{isSaida ? 'Faturamento' : 'Total Comprado'}</span><span className="text-2xl font-bold" style={{color: accentColor}}>R$ {selectedDayData.totalValue.toLocaleString('pt-BR',{minimumFractionDigits:2})}</span></div>
                <div><span className="text-xs text-slate-600 uppercase font-bold block">Volume</span><span className="text-2xl font-bold" style={{color: accentColor}}>{smartNumber(selectedDayData.totalQty,'un')}</span></div>
              </div>
            </div>
            <button onClick={() => setSelectedDay(null)} className="bg-white hover:bg-red-50 text-red-600 p-2 rounded-lg border border-red-200"><X className="w-4 h-4"/></button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><MapIcon className="w-4 h-4" style={{color: accentColor}}/> Mapa do Dia</h4>
              <div className="h-72 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                <MapContainer center={[-14.235,-51.925]} zoom={4} style={{height:'100%',width:'100%'}}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"/>
                  <MapController coords={selectedDayMapFocus}/>
                  {selectedDayData.states.map(uf => (<CircleMarker key={uf} center={STATE_COORDINATES[uf]} pathOptions={{color: accentColor, fillColor: accentColor, fillOpacity:0.7, weight:2}} radius={25}><Tooltip><strong>{uf}</strong></Tooltip></CircleMarker>))}
                </MapContainer>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">{isSaida ? <User className="w-4 h-4" style={{color: accentColor}}/> : <Building2 className="w-4 h-4" style={{color: accentColor}}/>}{peerLabel} ({selectedDayData.peers.length})</h4>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                {selectedDayData.peers.map((peer, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="flex justify-between items-start mb-2"><div><div className="font-bold text-slate-800 text-sm">{peer.name}</div><div className="text-[10px] text-slate-500">{peer.cnpj} • {peer.uf}</div></div><div className="text-sm font-bold" style={{color: accentColor}}>R$ {peer.totalValue.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div></div>
                    <div className="border-t border-slate-200 pt-2">{peer.products.map((prod, pIdx) => (<div key={pIdx} className="flex justify-between text-xs text-slate-600 py-0.5"><span className="truncate flex-1">{prod.prodNome}</span><span className="font-bold ml-2">{smartNumber(prod.prodQty, prod.prodUnit)} {smartUnit(prod.prodUnit)}</span></div>))}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {dash.topPairs && dash.topPairs.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><RefreshCw className="w-5 h-5 text-indigo-500"/>Padrões de Compra (Cross-Selling Recorrente)</h3>
          <p className="text-xs text-slate-500 mb-4">Clique em uma combinação para ver os {isSaida ? 'clientes' : 'fornecedores'} que compraram estes produtos juntos.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dash.topPairs.map((pair, idx) => {
              const isSelected = selectedPair && selectedPair.items[0] === pair.items[0] && selectedPair.items[1] === pair.items[1];
              return (
                <div key={idx} onClick={() => setSelectedPair(isSelected ? null : pair)} className={`p-4 rounded-lg flex items-center gap-4 cursor-pointer transition-all border ${isSelected ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200 shadow-md' : 'bg-slate-50 border-slate-200 hover:shadow-md hover:border-indigo-300'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-700 truncate" title={pair.items[0]}>{pair.items[0]}</div>
                    <div className="text-xs text-indigo-400 my-1 font-bold">+</div>
                    <div className="text-xs font-bold text-slate-700 truncate" title={pair.items[1]}>{pair.items[1]}</div>
                  </div>
                  <div className={`flex-shrink-0 text-center py-2 px-3 rounded-lg border ${isSelected ? 'bg-white border-indigo-200' : 'bg-white border-slate-200'}`}>
                    <div className="text-xl font-black text-indigo-600">{pair.count}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">{isSaida ? 'Clientes' : 'Forn.'}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {selectedPair && (
            <div className="mt-6 p-5 bg-indigo-50 rounded-xl border border-indigo-200 relative shadow-inner">
              <button onClick={() => setSelectedPair(null)} className="absolute top-4 right-4 text-indigo-400 hover:text-indigo-600 bg-white p-1 rounded-md border border-indigo-100"><X className="w-4 h-4"/></button>
              <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2 pr-8">{isSaida ? <User className="w-5 h-5"/> : <Building2 className="w-5 h-5"/>}{isSaida ? 'Clientes' : 'Fornecedores'} com este padrão de compra</h4>
              <div className="flex flex-wrap items-center gap-2 text-sm text-indigo-700 mb-5 font-medium bg-white px-4 py-2 rounded-lg border border-indigo-100 w-fit shadow-sm"><span>{selectedPair.items[0]}</span><strong className="text-indigo-900 text-lg">+</strong><span>{selectedPair.items[1]}</span></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-72 overflow-y-auto pr-2">
                {dash.clientsByRevenue.filter(c => c.products[selectedPair.items[0]] && c.products[selectedPair.items[1]]).map((client, idx) => {
                  const valA = client.products[selectedPair.items[0]];
                  const valB = client.products[selectedPair.items[1]];
                  return (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-indigo-100 hover:border-indigo-300 transition-colors hover:shadow-md flex flex-col gap-2">
                      <div><div className="font-bold text-slate-800 text-sm truncate" title={client.name}>{client.name}</div><div className="text-[10px] text-slate-500 mt-0.5">{client.cnpj} • {client.uf}</div></div>
                      <div className="text-[10px] space-y-1.5 mt-2 border-t border-slate-100 pt-3">
                        <div className="flex justify-between items-center"><span className="text-slate-500 truncate mr-2 flex-1" title={selectedPair.items[0]}>{selectedPair.items[0]}</span><span className="font-bold text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded">R$ {valA.toLocaleString('pt-BR',{minimumFractionDigits:2})}</span></div>
                        <div className="flex justify-between items-center"><span className="text-slate-500 truncate mr-2 flex-1" title={selectedPair.items[1]}>{selectedPair.items[1]}</span><span className="font-bold text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded">R$ {valB.toLocaleString('pt-BR',{minimumFractionDigits:2})}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5" style={{color: accentColor}}/> Classificação ABC ({isSaida ? 'Faturamento' : 'Volume Comprado'})</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {dash.productsByRevenue.map((prod, idx) => {
              const pct = (prod.revenue/(dash.productsByRevenue[0]?.revenue||1))*100;
              const bc = prod.classification==='A'?'bg-emerald-100 text-emerald-700 border-emerald-200':prod.classification==='B'?'bg-amber-100 text-amber-700 border-amber-200':'bg-red-50 text-red-700 border-red-100';
              return (
                <div key={idx} className="space-y-1 p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100">
                  <div className="flex justify-between text-sm items-center">
                    <div className="flex items-center gap-2 w-2/3"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${bc}`}>{prod.classification}</span><span className="font-medium text-slate-700 truncate">{prod.name}</span></div>
                    <span className="font-bold text-[#222222]">R$ {prod.revenue.toLocaleString('pt-BR',{notation:'compact'})}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${pct}%`, backgroundColor: accentColor}}></div></div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-emerald-600"/> Top 5 — Maior Volume</h3>
          <div className="space-y-4">
            {dash.productsByQty.slice(0,5).map((prod, idx) => {
              const pct = (prod.qty/(dash.productsByQty[0]?.qty||1))*100;
              return (<div key={idx} className="space-y-1"><div className="flex justify-between text-sm"><span className="truncate w-2/3 font-medium text-slate-700">{prod.name}</span><span className="font-bold text-emerald-700">{smartNumber(prod.qty,prod.unit)} {smartUnit(prod.unit)}</span></div><div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{width:`${pct}%`}}></div></div></div>);
            })}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 flex items-center gap-2"><ArrowUpRight className="w-4 h-4"/> Detalhamento Completo</div>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-slate-500 uppercase text-xs font-bold sticky top-0 shadow-sm">
              <tr><th className="px-6 py-3 border-b border-slate-100">Curva</th><th className="px-6 py-3 border-b border-slate-100">Produto</th><th className="px-6 py-3 text-right border-b border-slate-100">Qtd</th><th className="px-6 py-3 text-right border-b border-slate-100">{isSaida ? 'Preço Médio' : 'Custo Médio'}</th><th className="px-6 py-3 text-right border-b border-slate-100">Total</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dash.productsByRevenue.map((prod, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3"><span className={`text-[10px] font-bold px-2 py-1 rounded ${prod.classification==='A'?'bg-emerald-100 text-emerald-800':prod.classification==='B'?'bg-amber-100 text-amber-800':'bg-red-50 text-red-800'}`}>{prod.classification}</span></td>
                  <td className="px-6 py-3 font-medium text-slate-700">
                    <div className="flex items-center gap-2">{idx<3&&<Star className="w-3 h-3 text-[#D9C14A] fill-current"/>} {prod.name}</div>
                    {prod.topAffinities && prod.topAffinities.length > 0 && (<div className="text-[10px] text-slate-400 mt-1.5 flex gap-1 items-start"><RefreshCw className="w-3 h-3 text-indigo-400 mt-px flex-shrink-0"/><span><strong className="text-indigo-400">Comprado junto com:</strong> {prod.topAffinities.join(', ')}</span></div>)}
                  </td>
                  <td className="px-6 py-3 text-right text-slate-600">{smartNumber(prod.qty,prod.unit)} {smartUnit(prod.unit)}</td>
                  <td className="px-6 py-3 text-right text-slate-600">R$ {(prod.revenue/(prod.qty||1)).toFixed(2)}</td>
                  <td className="px-6 py-3 text-right font-bold text-[#222222]">R$ {prod.revenue.toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MODAL: CONFIRMAÇÃƒO DE NCM AMBÍGUA
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const NCMSelectorModal = ({ ncm, prodNome, opcoes, onSelecionar, onFechar }) => (
  <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onFechar}>
    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
      <div className="flex items-start justify-between mb-1">
        <h3 className="font-bold text-slate-800 text-base">Enquadramento Fiscal — NCM {ncm}</h3>
        <button onClick={onFechar} className="text-slate-400 hover:text-slate-600 ml-4 flex-shrink-0">
          <X className="w-5 h-5"/>
        </button>
      </div>
      <p className="text-xs text-slate-500 mb-1">Produto: <strong className="text-slate-700">{prodNome}</strong></p>
      <p className="text-xs text-slate-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
        Esta NCM possui múltiplas descrições fiscais na LC 214/2025. Selecione a que descreve este produto para aplicar a redução correta de CBS/IBS, ou escolha "Nenhuma se aplica".
      </p>
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {opcoes.map((op, i) => (
          <button
            key={i}
            onClick={() => onSelecionar(i)}
            className="w-full text-left p-3 border border-slate-200 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-colors group"
          >
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase inline-block mb-1 ${op.reducao === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-blue-700'}`}>
              {op.reducao === 100 ? 'Alíquota Zero (100%)' : `Redução ${op.reducao}%`} — {op.anexo}
            </span>
            <p className="text-sm text-slate-700 group-hover:text-[#222222]">{op.desc}</p>
          </button>
        ))}
        <button
          onClick={() => onSelecionar(null)}
          className="w-full text-left p-3 border-2 border-dashed border-slate-300 rounded-xl hover:border-red-400 hover:bg-red-50 transition-colors group"
        >
          <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase inline-block mb-1 bg-slate-100 text-slate-600">
            Alíquota Cheia (0% redução)
          </span>
          <p className="text-sm text-slate-500 group-hover:text-red-700">Nenhuma das descrições acima se aplica a este produto. CBS e IBS serão calculados pela alíquota integral.</p>
        </button>
      </div>
    </div>
  </div>
);

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ABA: INSIGHTS DE REDUÇÃƒO (NCM)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const ConferenciaNCMTab = memo(({ saidasData, entradasData, cnpj, usuario, getCached, saveDecision, deleteDecision, clearAllDecisions, loadingNcmDecisoes, getCachedNbs, saveDecisionNbs, loadingNbsDecisoes, confirmacoes, setConfirmacoes }) => {
  const [flow, setFlow] = useState('saidas');
  const [selectedCompetence, setSelectedCompetence] = useState('TODAS');
  const [vetForcados, setVetForcados] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('ncm_vet_forcados_v1') || '[]')); }
    catch { return new Set(); }
  });
  const [foraAprovados, setForaAprovados] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('ncm_fora_aprovados_v1') || '[]')); }
    catch { return new Set(); }
  });
  const [clearingAll, setClearingAll] = useState(false);
  const [expandedEnquadrado, setExpandedEnquadrado] = useState(new Set());
  const [ncmReviewMode, setNcmReviewMode] = useState('lote'); // 'lote' | 'detalhado'

  const forcarVeterinario = (ncm) => {
    setVetForcados(prev => {
      const next = new Set(prev);
      next.add(ncm);
      localStorage.setItem('ncm_vet_forcados_v1', JSON.stringify([...next]));
      return next;
    });
  };

  const aprovarTodosFora = () => {
    setForaAprovados(prev => {
      const next = new Set([...prev, ...foraItems.map(i => i.key)]);
      localStorage.setItem('ncm_fora_aprovados_v1', JSON.stringify([...next]));
      return next;
    });
  };

  const baseData = flow === 'saidas' ? saidasData : entradasData;

  const competenceIndex = useMemo(() => {
    const idx = new Map();
    baseData.forEach(item => {
      if (!item.date) return;
      const d = new Date(item.date);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (!idx.has(key)) idx.set(key, []);
      idx.get(key).push(item);
    });
    return idx;
  }, [baseData]);

  const availableCompetences = useMemo(() => (
    Array.from(competenceIndex.keys()).sort().reverse()
  ), [competenceIndex]);

  const currentData = useMemo(() => (
    selectedCompetence === 'TODAS' ? baseData : (competenceIndex.get(selectedCompetence) ?? [])
  ), [baseData, selectedCompetence, competenceIndex]);

  const fBRL = v => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const save = (obj) => setConfirmacoes(obj);
  const confirmar = (ncm) => save({ ...confirmacoes, [ncm]: 'ok' });
  const rejeitar  = (ncm) => save({ ...confirmacoes, [ncm]: 'rejected' });
  const resetar   = (ncm) => { const n = { ...confirmacoes }; delete n[ncm]; save(n); };

  // Classifica cada NCM único usando o discriminador — agrupa por NCM+produto
  // Espera o cache de decisões carregar antes de processar, para não gastar
  // uma passada inteira sem cache e refazer tudo de novo assim que ele chega.
  const { itens, revisaoItems, foraItems } = useMemo(() => {
    if (loadingNcmDecisoes) return { itens: [], revisaoItems: [], foraItems: [] };
    const mapa = {};    // NCM → item ENQUADRADO
    const filaMap = {}; // chave → item CONFERIR (revisão manual)
    const foraMap = {}; // chave → item FORA_DO_ANEXO (sem benefício)
    const compAtual = selectedCompetence === 'TODAS' ? null : selectedCompetence;

    currentData.forEach(item => {
      const ncm = (item.prodNCM || '').replace(/\D/g, '').padStart(8, '0');
      if (!ncm || ncm === '00000000') return;

      const xProd = item.prodNome || '';
      const cached = getCached(cnpj, ncm, xProd, compAtual);
      const disc = discriminarNCM(ncm, xProd, cached, compAtual);

      if (disc.status === 'ENQUADRADO') {
        let red;
        if (disc.formaConfirmacao === 'ncm_direta') {
          red = getReducaoNCM(item.prodNCM) || getReducaoNBS(item.prodNBS || '');
        } else {
          red = disc.reducao != null
            ? { reducao: disc.reducao, tipo: disc.tipo, anexo: disc.anexo, desc: disc.substancia }
            : (getReducaoNCM(item.prodNCM) || getReducaoNBS(item.prodNBS || ''));
        }
        if (!red || red.reducao === 0 || red._ambiguous) return;
        if (!mapa[ncm]) mapa[ncm] = {
          ncm, ncmDisplay: item.prodNCM || ncm, nome: xProd || '-',
          reduction: red,
          statusNCM: 'ENQUADRADO',
          formaConfirmacao: disc.formaConfirmacao,
          substancia: disc.substancia,
          fundamentacao: disc.fundamentacao,
          faturamento: 0, count: 0,
          _xp: {},
        };
        mapa[ncm].faturamento += item.prodValTotal || 0;
        mapa[ncm].count += 1;
        if (!mapa[ncm]._xp[xProd]) mapa[ncm]._xp[xProd] = { faturamento: 0, count: 0 };
        mapa[ncm]._xp[xProd].faturamento += item.prodValTotal || 0;
        mapa[ncm]._xp[xProd].count += 1;

      } else if (disc.status === 'CONFERIR') {
        const key = `${ncm}_${xProd.slice(0, 40)}`;
        if (!filaMap[key]) {
          // O discriminador já filtrou os candidatos pelo CNAE; usamos diretamente.
          filaMap[key] = { key, ncm, xProd, status: 'CONFERIR', candidates: disc.candidates || [], faturamento: 0, count: 0 };
        }
        filaMap[key].faturamento += item.prodValTotal || 0;
        filaMap[key].count += 1;

      } else if (disc.status === 'FORA_DO_ANEXO') {
        if (vetForcados.has(ncm)) {
          // Usuário marcou como produto veterinário — envia para fila de revisão.
          // Para NCMs sem candidatos no mapa, constrói candidato sintético via NCM_REDUCOES.
          let vetCandidates = disc.candidates;
          if (vetCandidates.length === 0) {
            const red = getReducaoNCM(item.prodNCM);
            if (red) vetCandidates = [{ idx: 0, sub: { desc: red.desc || 'Medicamento / produto veterinário', reducao: red.reducao, tipo: red.tipo, anexo: red.anexo || 'Anexo IX da LC 214/2025' }, s: 0 }];
          }
          const key = `${ncm}_${xProd.slice(0, 40)}`;
          if (!filaMap[key]) filaMap[key] = { key, ncm, xProd, status: 'CONFERIR', candidates: vetCandidates, faturamento: 0, count: 0 };
          filaMap[key].faturamento += item.prodValTotal || 0;
          filaMap[key].count += 1;
        } else {
          // Sem benefício automático — exibir na seção FORA para ciência do usuário
          const key = `${ncm}_${xProd.slice(0, 40)}`;
          if (!foraMap[key]) foraMap[key] = {
            key, ncm, ncmDisplay: item.prodNCM || ncm, xProd,
            fundamentacao: disc.fundamentacao,
            motivoFora: disc.motivoFora,
            hasCandidates: (disc.candidates || []).length > 0,
            faturamento: 0, count: 0,
          };
          foraMap[key].faturamento += item.prodValTotal || 0;
          foraMap[key].count += 1;
        }
      }
    });

    return {
      itens: Object.values(mapa).sort((a, b) => b.faturamento - a.faturamento).map(m => {
        const { _xp, ...rest } = m;
        return {
          ...rest,
          xProdsList: Object.entries(_xp)
            .map(([xProd, v]) => ({ xProd, ...v }))
            .sort((a, b) => b.faturamento - a.faturamento),
        };
      }),
      revisaoItems: Object.values(filaMap).sort((a, b) => b.faturamento - a.faturamento),
      foraItems: Object.values(foraMap).sort((a, b) => b.faturamento - a.faturamento),
    };
  }, [currentData, getCached, cnpj, selectedCompetence, vetForcados, loadingNcmDecisoes]);

  // Classifica cada NBS único (serviços/NFS-e) — direto pela tabela NBS_REDUCOES,
  // ou pela decisão salva (nbsDecisoes); sem match nenhum vai para a fila de revisão.
  const { itensNbs, pendentesNbs } = useMemo(() => {
    if (loadingNbsDecisoes) return { itensNbs: [], pendentesNbs: [] };
    const mapa = {};
    const filaMap = {};
    currentData.forEach(item => {
      if (item.tipoDoc !== 'NFSe') return;
      const nbs = (item.prodNBS || '').replace(/\D/g, '');
      if (!nbs) return;

      let red = getReducaoNBS(nbs);
      if (!red) {
        const cachedDec = getCachedNbs(cnpj, nbs);
        if (cachedDec) red = { reducao: cachedDec.reducao, tipo: cachedDec.tipo, anexo: cachedDec.anexo, desc: cachedDec.desc };
      }

      if (!red) {
        if (!filaMap[nbs]) filaMap[nbs] = { key: nbs, nbs, xProd: item.prodNome || '', faturamento: 0, count: 0 };
        filaMap[nbs].faturamento += item.prodValTotal || 0;
        filaMap[nbs].count += 1;
        return;
      }

      if (!mapa[nbs]) mapa[nbs] = { nbs, nome: item.prodNome || '-', reduction: red, faturamento: 0, count: 0 };
      mapa[nbs].faturamento += item.prodValTotal || 0;
      mapa[nbs].count += 1;
    });
    return {
      itensNbs: Object.values(mapa).sort((a, b) => b.faturamento - a.faturamento),
      pendentesNbs: Object.values(filaMap).sort((a, b) => b.faturamento - a.faturamento),
    };
  }, [currentData, getCachedNbs, cnpj, loadingNbsDecisoes]);

  // Grupos de revisão em lote: todos os NCMs pendentes (agrupados por NCM)
  const gruposLote = useMemo(() => {
    const byNcm = {};
    revisaoItems.forEach(item => {
      if (!byNcm[item.ncm]) byNcm[item.ncm] = [];
      byNcm[item.ncm].push(item);
    });
    return Object.values(byNcm)
      .filter(g => g.length >= 1)
      .map(g => ({
        ncm: g[0].ncm,
        items: g,
        distinctCount: g.length,
        candidates: g[0].candidates || [],
        totalFaturamento: g.reduce((s, i) => s + i.faturamento, 0),
      }))
      .sort((a, b) => b.totalFaturamento - a.totalFaturamento);
  }, [revisaoItems]);

  const gruposLoteNCMs = useMemo(
    () => new Set(gruposLote.map(g => g.ncm)),
    [gruposLote]
  );
  const singleRevisaoItems = revisaoItems.filter(i => !gruposLoteNCMs.has(i.ncm));

  const pendentes   = itens.filter(i => !confirmacoes[i.ncm]);
  const confirmados = itens.filter(i => confirmacoes[i.ncm] === 'ok');
  const rejeitados  = itens.filter(i => confirmacoes[i.ncm] === 'rejected');

  const aprovarTodos = () => {
    const n = { ...confirmacoes };
    pendentes.forEach(i => { n[i.ncm] = 'ok'; });
    save(n);
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
        <div>
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500"/>
            Conferência de Enquadramento NCM
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Valide se cada produto está corretamente enquadrado na NCM com redução de IBS/CBS.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-100 p-0.5 rounded-lg">
            <button onClick={() => { setFlow('saidas'); setSelectedCompetence('TODAS'); }} className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${flow==='saidas'?'bg-white text-slate-800 shadow-sm':'text-slate-500'}`}>Saídas</button>
            <button onClick={() => { setFlow('entradas'); setSelectedCompetence('TODAS'); }} className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${flow==='entradas'?'bg-white text-slate-800 shadow-sm':'text-slate-500'}`}>Entradas</button>
          </div>
          {pendentes.length > 0 && (
            <button onClick={aprovarTodos} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5"/> Aprovar Todos
            </button>
          )}
          <button
            onClick={async () => {
              const XLSX = await import('xlsx');
              const wb = XLSX.utils.book_new();
              const fBRLn = v => Number((v||0).toFixed(2));
              const comp = selectedCompetence === 'TODAS' ? 'Todas' : selectedCompetence;
              const amostraProdutos = (items) => {
                const nomes = [...new Set(items.map(it => it.xProd).filter(Boolean))];
                const amostra = nomes.slice(0, 3).join(' | ');
                return nomes.length > 3 ? `${amostra} … (+${nomes.length - 3})` : amostra;
              };

              // Aba 1 — Revisão em Lote: cada NCM pendente com suas alternativas possíveis
              const lote = [];
              gruposLote.forEach(g => {
                const base = {
                  'NCM': g.ncm,
                  'Produtos (amostra)': amostraProdutos(g.items),
                  'Qtd Produtos Distintos': g.distinctCount,
                  'Faturamento Total (R$)': fBRLn(g.totalFaturamento),
                };
                if (g.candidates && g.candidates.length > 0) {
                  g.candidates.forEach(c => lote.push({
                    ...base,
                    'Alternativa': c.sub?.desc || '',
                    'Redução': c.sub?.reducao === 100 ? 'Alíquota Zero' : c.sub?.reducao > 0 ? `${c.sub.reducao}%` : 'Sem redução',
                    'Anexo': c.sub?.anexo || '',
                  }));
                } else {
                  lote.push({ ...base, 'Alternativa': '', 'Redução': '', 'Anexo': '' });
                }
              });
              const ws1 = XLSX.utils.json_to_sheet(lote.length ? lote : [{ 'Info': 'Nenhum NCM pendente de revisão em lote' }]);
              ws1['!cols'] = [{wch:12},{wch:50},{wch:14},{wch:18},{wch:40},{wch:14},{wch:28}];
              XLSX.utils.book_append_sheet(wb, ws1, 'Revisão em Lote');

              // Aba 2 — Análise Detalhada: cada produto com as possibilidades de NCM
              const detalhada = revisaoItems.map(i => ({
                'NCM': i.ncm,
                'Produto': i.xProd,
                'Status': i.status,
                'Candidatos Possíveis': (i.candidates || []).map(c => c.sub?.desc).filter(Boolean).join(' | '),
                'Faturamento (R$)': fBRLn(i.faturamento),
                'Qtd Itens': i.count,
                'Competência': comp,
                'Fluxo': flow === 'saidas' ? 'Saídas' : 'Entradas',
              }));
              const ws2 = XLSX.utils.json_to_sheet(detalhada.length ? detalhada : [{ 'Info': 'Nenhuma divergência encontrada' }]);
              ws2['!cols'] = [{wch:12},{wch:40},{wch:12},{wch:80},{wch:18},{wch:10},{wch:12},{wch:10}];
              XLSX.utils.book_append_sheet(wb, ws2, 'Análise Detalhada');

              // Aba 3 — Resultado: o enquadramento que já foi confirmado manualmente
              // (preenchido) mais o que ainda está pendente (linha fica vazia nas
              // colunas de resultado, para a pessoa preencher/validar depois).
              const decididos = itens.filter(i => i.formaConfirmacao === 'manual').map(i => ({
                'NCM': i.ncmDisplay,
                'Produto': i.nome,
                'Resultado (Substância / Enquadramento)': i.substancia || '',
                'Fundamentação': i.fundamentacao || '',
                'Redução Aplicada': i.reduction?.reducao === 100 ? 'Alíquota Zero' : i.reduction?.reducao > 0 ? `${i.reduction.reducao}%` : 'Sem redução',
                'Faturamento (R$)': fBRLn(i.faturamento),
                'Qtd Itens': i.count,
                'Status': 'Confirmado',
              }));
              const pendentesResultado = revisaoItems.map(i => ({
                'NCM': i.ncm,
                'Produto': i.xProd,
                'Resultado (Substância / Enquadramento)': '',
                'Fundamentação': '',
                'Redução Aplicada': '',
                'Faturamento (R$)': fBRLn(i.faturamento),
                'Qtd Itens': i.count,
                'Status': 'Pendente',
              }));
              const resultado = [...decididos, ...pendentesResultado].sort((a, b) => b['Faturamento (R$)'] - a['Faturamento (R$)']);
              const ws3 = XLSX.utils.json_to_sheet(resultado.length ? resultado : [{ 'Info': 'Nenhum NCM passou pela revisão ainda' }]);
              ws3['!cols'] = [{wch:12},{wch:40},{wch:40},{wch:40},{wch:16},{wch:16},{wch:10},{wch:12}];
              XLSX.utils.book_append_sheet(wb, ws3, 'Resultado');

              XLSX.writeFile(wb, `conferencia-ncm-${flow}-${comp}.xlsx`);
            }}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5"/> Exportar Excel
          </button>
        </div>
      </div>

      {/* Filtro de Competência */}
      {availableCompetences.length > 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-3.5 h-3.5 text-slate-400"/>
            <span className="text-xs font-bold text-slate-600">
              Competência: {selectedCompetence === 'TODAS' ? 'Todo o Período' : selectedCompetence}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCompetence('TODAS')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors ${selectedCompetence==='TODAS'?'bg-[#222222] text-white border-transparent':'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >TODAS</button>
            {availableCompetences.map(comp => (
              <button
                key={comp}
                onClick={() => setSelectedCompetence(comp)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors ${selectedCompetence===comp?'bg-[#222222] text-white border-transparent':'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              >{comp}</button>
            ))}
          </div>
        </div>
      )}

      {loadingNcmDecisoes && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 flex items-center gap-2 text-xs font-bold text-violet-700">
          <RefreshCw className="w-4 h-4 animate-spin"/> Carregando decisões salvas...
        </div>
      )}

      {/* Toggle modo de revisão + botão limpar */}
      <div className="flex items-center gap-3 flex-wrap">
        {revisaoItems.length > 0 && (
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setNcmReviewMode('lote')}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 ${
                ncmReviewMode === 'lote'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5"/>
              Revisão em Lote
            </button>
            <button
              onClick={() => setNcmReviewMode('detalhado')}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 ${
                ncmReviewMode === 'detalhado'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <List className="w-3.5 h-3.5"/>
              Análise Detalhada
            </button>
          </div>
        )}

        <button
          onClick={async () => {
            if (!window.confirm('Apagar TODAS as decisões de NCM salvas para este CNPJ? Esta ação não pode ser desfeita.')) return;
            setClearingAll(true);
            await clearAllDecisions(cnpj);
            setClearingAll(false);
          }}
          disabled={clearingAll}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 border border-red-200 bg-white hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${clearingAll ? 'animate-spin' : ''}`}/>
          {clearingAll ? 'Limpando...' : 'Limpar decisões salvas'}
        </button>
      </div>

      {/* Revisão em Lote — cards por NCM */}
      {ncmReviewMode === 'lote' && gruposLote.length > 0 && (
        <NcmGroupReview
          grupos={gruposLote}
          cnpj={cnpj}
          saveDecision={saveDecision}
          usuario={usuario}
          competenciaVigencia={selectedCompetence === 'TODAS' ? null : selectedCompetence}
        />
      )}

      {/* Análise Detalhada — classificação individual item a item */}
      {ncmReviewMode === 'detalhado' && (
        <NcmReviewQueue
          items={revisaoItems}
          cnpj={cnpj}
          saveDecision={saveDecision}
          usuario={usuario}
          competenciaVigencia={selectedCompetence === 'TODAS' ? null : selectedCompetence}
        />
      )}

      {/* NCMs sem benefício — FORA DO ANEXO XIV */}
      {(() => {
        const foraPendentes = foraItems.filter(i => !foraAprovados.has(i.key));
        if (foraPendentes.length === 0) return null;
        return (
          <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-red-100 border-b border-red-200 flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black text-red-800">Sem Benefício — Fora do Anexo XIV</span>
              <span className="text-xs bg-red-600 text-white font-bold px-1.5 py-0.5 rounded-full">{foraPendentes.length}</span>
              <span className="text-xs text-red-600 ml-1 flex-1">Tributação integral — não listados no Anexo XIV</span>
              <button
                onClick={aprovarTodosFora}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
              >
                ✓ Aprovar Todos
              </button>
            </div>
            <div className="divide-y divide-red-200">
              {foraPendentes.map(item => (
                <div key={item.key} className="px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black bg-slate-800 text-white px-2 py-0.5 rounded font-mono">{item.ncmDisplay}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-red-100 text-red-700 border-red-300">FORA DO ANEXO XIV</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 mt-1 truncate" title={item.xProd}>{item.xProd}</p>
                  <p className="text-xs text-red-600 mt-0.5">{item.fundamentacao}</p>
                  <p className="text-xs text-slate-400">R$ {fBRL(item.faturamento)} · {item.count} {item.count === 1 ? 'item' : 'itens'}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-amber-600">{pendentes.length}</div>
          <div className="text-xs font-bold text-amber-700 mt-0.5">Pendentes</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-emerald-600">{confirmados.length}</div>
          <div className="text-xs font-bold text-emerald-700 mt-0.5">Confirmados</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-red-600">{rejeitados.length}</div>
          <div className="text-xs font-bold text-red-700 mt-0.5">Rejeitados</div>
        </div>
      </div>

      {/* Lista */}
      {itens.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30"/>
          <p className="font-bold">Nenhum produto com redução NCM encontrado nos dados carregados.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {itens.map(item => {
            const status = confirmacoes[item.ncm];
            return (
              <div key={item.ncm} className={`bg-white rounded-xl border px-4 py-3 flex flex-col md:flex-row items-start md:items-center gap-3 transition-all ${
                status === 'ok'       ? 'border-emerald-200 bg-emerald-50/40' :
                status === 'rejected' ? 'border-red-200 bg-red-50/30 opacity-60' :
                'border-slate-200'
              }`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black bg-slate-800 text-white px-2 py-0.5 rounded font-mono">{item.ncmDisplay}</span>
                    {item.reduction.reducao === 100
                      ? <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300 px-1.5 py-0.5 rounded">Alíquota Zero</span>
                      : <span className="text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-300 px-1.5 py-0.5 rounded">↓ {item.reduction.reducao}% redução</span>
                    }
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-bold">{item.reduction.anexo}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 mt-1 truncate" title={item.nome}>{item.nome}</p>
                  <div className="mt-1.5 bg-slate-50 border border-slate-200 rounded px-2 py-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Critério do Anexo: </span>
                    <span className="text-[10px] text-slate-600">{item.reduction.desc}</span>
                  </div>

                  {/* Lista de produtos com Corrigir — somente para decisões manuais */}
                  {item.formaConfirmacao === 'manual' && item.xProdsList?.length > 0 && (() => {
                    const isOpen = expandedEnquadrado.has(item.ncm);
                    return (
                      <div className="mt-2">
                        <button
                          onClick={() => setExpandedEnquadrado(prev => {
                            const next = new Set(prev);
                            if (next.has(item.ncm)) next.delete(item.ncm); else next.add(item.ncm);
                            return next;
                          })}
                          className="text-[11px] text-violet-500 hover:text-violet-700 font-semibold flex items-center gap-1"
                        >
                          {isOpen ? '▾' : '▸'} {isOpen ? 'Ocultar produtos' : `Corrigir produto (${item.xProdsList.length})`}
                        </button>
                        {isOpen && (
                          <div className="mt-1.5 border border-violet-100 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                            {item.xProdsList.map(p => (
                              <div key={p.xProd} className="px-3 py-2 flex items-center justify-between gap-2 border-b border-violet-50 last:border-0 hover:bg-violet-50/40">
                                <p className="text-xs text-slate-600 truncate min-w-0" title={p.xProd}>{p.xProd}</p>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[10px] text-slate-400">R$ {fBRL(p.faturamento)}</span>
                                  <button
                                    onClick={() => deleteDecision(cnpj, item.ncm, p.xProd)}
                                    className="text-[10px] text-red-500 hover:text-red-700 font-bold underline whitespace-nowrap"
                                  >
                                    Reabrir
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="text-right shrink-0 hidden md:block">
                  <div className="text-sm font-bold text-slate-800">R$ {fBRL(item.faturamento)}</div>
                  <div className="text-[10px] text-slate-400">{item.count} {item.count === 1 ? 'item' : 'itens'}</div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {status === 'ok' && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-1 rounded-lg">✓ Confirmado</span>
                  )}
                  {status === 'rejected' && (
                    <span className="text-xs font-bold text-red-700 bg-red-100 border border-red-300 px-2 py-1 rounded-lg">✕ Rejeitado</span>
                  )}
                  {!status && (
                    <>
                      <button onClick={() => confirmar(item.ncm)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors">✓ OK</button>
                      <button onClick={() => rejeitar(item.ncm)}  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors">✕ Rejeitar</button>
                    </>
                  )}
                  {status && (
                    <button onClick={() => resetar(item.ncm)} className="px-2 py-1.5 text-slate-400 hover:text-slate-600 text-xs rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">Reverter</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Serviços — Conferência NBS ─────────────────────────────────── */}
      {(itensNbs.length > 0 || pendentesNbs.length > 0) && (
        <div className="pt-4 mt-4 border-t border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-violet-500"/>
            Serviços — Conferência NBS
          </h3>

          <NbsReviewQueue
            items={pendentesNbs}
            cnpj={cnpj}
            saveDecision={saveDecisionNbs}
            usuario={usuario}
            competenciaVigencia={selectedCompetence === 'TODAS' ? null : selectedCompetence}
          />

          {itensNbs.length > 0 && (
            <div className="space-y-2">
              {itensNbs.map(item => (
                <div key={item.nbs} className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex flex-col md:flex-row items-start md:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black bg-violet-800 text-white px-2 py-0.5 rounded font-mono">NBS {item.nbs}</span>
                      {item.reduction.reducao === 100
                        ? <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300 px-1.5 py-0.5 rounded">Alíquota Zero</span>
                        : item.reduction.reducao > 0
                          ? <span className="text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-300 px-1.5 py-0.5 rounded">↓ {item.reduction.reducao}% redução</span>
                          : <span className="text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300 px-1.5 py-0.5 rounded">Sem redução</span>
                      }
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-bold">{item.reduction.anexo}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 mt-1 truncate" title={item.nome}>{item.nome}</p>
                    {item.reduction.desc && (
                      <div className="mt-1.5 bg-slate-50 border border-slate-200 rounded px-2 py-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Critério: </span>
                        <span className="text-[10px] text-slate-600">{item.reduction.desc}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0 hidden md:block">
                    <div className="text-sm font-bold text-slate-800">R$ {fBRL(item.faturamento)}</div>
                    <div className="text-[10px] text-slate-400">{item.count} {item.count === 1 ? 'nota' : 'notas'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

const NCM_CONFIRMACOES_KEY = 'ncm_confirmacoes_v1';

const ReductionInsightsTab = memo(({ saidasData, entradasData, simplesRate, reformYear, empresaRegime, cnpj, getCached, getCachedNbs, ncmConfirmacoes }) => {
  const [flow, setFlow] = useState('saidas');
  const [modalTier, setModalTier] = useState(null); // null | 'zero' | 'reduced' | 'full'
  const [modalComp, setModalComp] = useState('TODAS');

  const fBRL = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const currentData = flow === 'saidas' ? saidasData : entradasData;

  // Competências disponíveis
  const competencias = useMemo(() => {
    const s = new Set();
    currentData.forEach(item => {
      if (item.date) {
        const d = new Date(item.date);
        if (!isNaN(d)) s.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
      }
    });
    return ['TODAS', ...Array.from(s).sort().reverse()];
  }, [currentData]);

  // Agrupamento base (todo período) para os cards
  const ncmGroups = useMemo(() => {
    const mapa = {};
    currentData.forEach(item => {
      const isServico = item.tipoDoc === 'NFSe';
      const nbsNorm = (item.prodNBS || '').replace(/\D/g, '');
      const ncm = isServico ? `NBS_${nbsNorm || 'SEM_NBS'}` : ((item.prodNCM || '').replace(/\D/g, '').padStart(8, '0') || 'SEM_NCM');
      if (!mapa[ncm]) {
        const xProd = item.prodNome || '';
        const cached = isServico ? null : getCached(cnpj, ncm, xProd, null);
        const cachedNbs = isServico ? getCachedNbs(cnpj, nbsNorm) : null;
        const { reduction, disc } = resolveReducaoEfetiva(item.prodNCM, xProd, item.prodNBS, cached, null, cachedNbs, ncmConfirmacoes);
        mapa[ncm] = {
          ncm, ncmDisplay: isServico ? `NBS ${nbsNorm || '—'}` : (item.prodNCM || 'S/NCM'), nome: xProd || '-',
          faturamento: 0,
          reduction,
          statusNCM: disc.status,
          substancia: disc.substancia,
          fundamentacao: disc.fundamentacao,
          semBeneficio: disc.status === 'FORA_DO_ANEXO',
        };
      }
      mapa[ncm].faturamento += item.prodValTotal || 0;
    });
    return Object.values(mapa).sort((a, b) => b.faturamento - a.faturamento);
  }, [currentData, getCached, getCachedNbs, cnpj, ncmConfirmacoes]);

  const totalFat = useMemo(() => ncmGroups.reduce((a, g) => a + g.faturamento, 0), [ncmGroups]);

  const { tiersZero, tiersReduced, tiersFull } = useMemo(() => {
    const tiersZero = [], tiersReduced = [], tiersFull = [];
    ncmGroups.forEach(g => {
      const p = g.reduction?.reducao || 0;
      if (p === 100) tiersZero.push(g);
      else if (p > 0) tiersReduced.push(g);
      else tiersFull.push(g);
    });
    return { tiersZero, tiersReduced, tiersFull };
  }, [ncmGroups]);

  const fatZero    = tiersZero.reduce((a, g)    => a + g.faturamento, 0);
  const fatReduced = tiersReduced.reduce((a, g) => a + g.faturamento, 0);
  const fatFull    = tiersFull.reduce((a, g)    => a + g.faturamento, 0);
  const percZero    = totalFat > 0 ? fatZero    / totalFat * 100 : 0;
  const percReduced = totalFat > 0 ? fatReduced / totalFat * 100 : 0;
  const percFull    = totalFat > 0 ? fatFull    / totalFat * 100 : 0;
  const percBeneficiado = percZero + percReduced;

  // Dados filtrados por competência para o modal
  const modalGroups = useMemo(() => {
    if (!modalTier) return [];
    const filtered = modalComp === 'TODAS' ? currentData : currentData.filter(item => {
      if (!item.date) return false;
      const d = new Date(item.date);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` === modalComp;
    });
    const mapa = {};
    filtered.forEach(item => {
      const isServico = item.tipoDoc === 'NFSe';
      const nbsNorm = (item.prodNBS || '').replace(/\D/g, '');
      const ncm = isServico ? `NBS_${nbsNorm || 'SEM_NBS'}` : ((item.prodNCM || '').replace(/\D/g, '').padStart(8, '0') || 'SEM_NCM');
      if (!mapa[ncm]) {
        const xProd = item.prodNome || '';
        const cached = isServico ? null : getCached(cnpj, ncm, xProd, null);
        const cachedNbs = isServico ? getCachedNbs(cnpj, nbsNorm) : null;
        const { reduction, disc } = resolveReducaoEfetiva(item.prodNCM, xProd, item.prodNBS, cached, null, cachedNbs, ncmConfirmacoes);
        mapa[ncm] = {
          ncm, ncmDisplay: isServico ? `NBS ${nbsNorm || '—'}` : (item.prodNCM || 'S/NCM'), nome: xProd || '-',
          faturamento: 0,
          reduction,
          statusNCM: disc.status,
          substancia: disc.substancia,
          fundamentacao: disc.fundamentacao,
          semBeneficio: disc.status === 'FORA_DO_ANEXO',
        };
      }
      mapa[ncm].faturamento += item.prodValTotal || 0;
    });
    const all = Object.values(mapa).sort((a, b) => b.faturamento - a.faturamento);
    if (modalTier === 'zero')    return all.filter(g => (g.reduction?.reducao || 0) === 100);
    if (modalTier === 'reduced') return all.filter(g => (g.reduction?.reducao || 0) > 0 && (g.reduction?.reducao || 0) < 100);
    return all.filter(g => (g.reduction?.reducao || 0) === 0);
  }, [modalTier, modalComp, currentData, getCached, getCachedNbs, cnpj, ncmConfirmacoes]);

  const modalTotalFat = modalGroups.reduce((a, g) => a + g.faturamento, 0);

  const TIER_CONFIG = {
    zero:    { label: 'Alíquota Zero',   badge: 'bg-emerald-100 text-emerald-800', bar: 'bg-emerald-500', border: 'border-emerald-200', hdr: 'bg-emerald-50', perc: 'text-emerald-600', fat: fatZero,    count: tiersZero.length,    pct: percZero },
    reduced: { label: 'Redução de 60%',  badge: 'bg-gray-100 text-[#222222]',       bar: 'bg-[#222222]',    border: 'border-gray-200',    hdr: 'bg-gray-50',    perc: 'text-blue-600',    fat: fatReduced, count: tiersReduced.length, pct: percReduced },
    full:    { label: 'Alíquota Cheia',  badge: 'bg-slate-100 text-slate-700',     bar: 'bg-slate-400',   border: 'border-slate-200',   hdr: 'bg-slate-50',   perc: 'text-slate-600',   fat: fatFull,    count: tiersFull.length,    pct: percFull },
  };

  const TIER_DESC = {
    zero:    'Medicamentos para diabetes, cardiovasculares, oncologia, doenças raras, HIV/IST e Farmácia Popular (Art. 146 LC 214 / LC 227/2026)',
    reduced: 'Demais medicamentos ANVISA, manipulação farmacêutica e higiene essencial do Anexo VIII (Art. 133 LC 214 / Art. 208 do Decreto)',
    full:    'Perfumaria, cosmético, conveniência e higiene não listada no Anexo VIII',
  };

  const exportarExcel = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    const linhas = ncmGroups.map(g => ({
      'NCM': g.ncmDisplay, 'Produto Principal': g.nome,
      'Faixa': g.reduction?.reducao === 100 ? 'Alíquota Zero' : (g.reduction?.reducao||0) > 0 ? `Redução ${g.reduction.reducao}%` : 'Alíquota Cheia',
      'Redução (%)': g.reduction?.reducao || 0,
      'Anexo LC 214': g.reduction?.anexo || '-',
      'Descrição Fiscal': g.reduction?.desc || 'Sem benefício',
      [`Faturamento (R$)`]: Number(g.faturamento.toFixed(2)),
      '% do Total': Number((totalFat > 0 ? g.faturamento/totalFat*100 : 0).toFixed(2)),
    }));
    const ws = XLSX.utils.json_to_sheet(linhas);
    ws['!cols'] = [{wch:12},{wch:40},{wch:16},{wch:14},{wch:16},{wch:36},{wch:22},{wch:12}];
    XLSX.utils.book_append_sheet(wb, ws, 'Triagem da Carteira');
    XLSX.writeFile(wb, `triagem-carteira-${reformYear}.xlsx`);
  };

  const openModal = (tier) => { setModalTier(tier); setModalComp('TODAS'); };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="bg-gradient-to-r from-[#222222] to-[#1a1a1a] p-6 rounded-xl text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2"><TrendingUp className="w-6 h-6"/> Triagem da Carteira — LC 214/2025</h3>
          <p className="text-gray-300 text-sm mt-1">Classificação do faturamento por faixa de alíquota da reforma tributária.</p>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex bg-white/10 p-1 rounded-lg border border-white/20">
            <button onClick={() => setFlow('saidas')} className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${flow==='saidas'?'bg-white text-[#222222] shadow-sm':'text-gray-300 hover:bg-white/10'}`}>Nas Vendas</button>
            <button onClick={() => setFlow('entradas')} className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${flow==='entradas'?'bg-white text-[#222222] shadow-sm':'text-gray-300 hover:bg-white/10'}`}>Nas Compras</button>
          </div>
          <button onClick={exportarExcel} className="px-4 py-2 rounded-md text-sm font-bold bg-white text-[#222222] shadow-sm hover:bg-gray-50">Exportar Excel</button>
        </div>
      </div>

      {/* Insight */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0"><TrendingUp className="w-5 h-5 text-amber-700"/></div>
          <div>
            <p className="font-bold text-amber-900 text-base">{percBeneficiado.toFixed(1)}% do {flow==='saidas'?'faturamento':'volume de compras'} está em categorias com alíquota reduzida ou zero</p>
            <p className="text-amber-700 text-sm mt-1 leading-relaxed">Mas isso só se converte em economia real se a empresa optar pelo <strong>Regime Regular (§3º do Art. 16 da LC 214)</strong>. No Simples Nacional puro, a partilha do DAS é fixa e o preço de balcão não muda automaticamente — a análise de migração de regime é o próximo passo.</p>
          </div>
        </div>
      </div>

      {/* 3 cards — clique abre modal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['zero','reduced','full'].map(tier => {
          const cfg = TIER_CONFIG[tier];
          return (
            <button key={tier} onClick={() => openModal(tier)}
              className={`bg-white border-2 ${cfg.border} rounded-xl p-5 text-left flex flex-col hover:shadow-md transition-all cursor-pointer`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`${cfg.badge} px-3 py-1 rounded-full text-xs font-bold`}>{cfg.label}</span>
                <span className="text-slate-400 text-xs font-bold">{cfg.count} NCMs →</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">{TIER_DESC[tier]}</p>
              <div className={`text-3xl font-black ${cfg.perc}`}>{cfg.pct.toFixed(1)}%</div>
              <div className="text-xs text-slate-500 mt-1">do {flow==='saidas'?'faturamento':'volume'} · R$ {fBRL(cfg.fat)}</div>
              <div className={`h-2 ${cfg.bar} rounded-full mt-3`} style={{ width: `${Math.min(cfg.pct,100)}%`, minWidth: cfg.pct>0?'4px':'0' }}/>
            </button>
          );
        })}
      </div>

      {/* Modal tela cheia */}
      {modalTier && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setModalTier(null)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className={`${TIER_CONFIG[modalTier].hdr} border-b ${TIER_CONFIG[modalTier].border} px-6 py-4 rounded-t-2xl flex items-center justify-between`}>
              <div>
                <span className={`${TIER_CONFIG[modalTier].badge} px-3 py-1 rounded-full text-xs font-bold`}>{TIER_CONFIG[modalTier].label}</span>
                <p className="text-[11px] text-slate-500 mt-2 max-w-lg">{TIER_DESC[modalTier]}</p>
              </div>
              <button onClick={() => setModalTier(null)} className="text-slate-400 hover:text-slate-700 text-2xl font-bold leading-none ml-4">✕</button>
            </div>

            {/* Filtro de competência */}
            <div className="px-6 pt-4 pb-3 border-b border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Filtrar por competência</p>
              <div className="flex flex-wrap gap-2">
                {competencias.map(c => (
                  <button key={c} onClick={() => setModalComp(c)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors ${modalComp===c?'bg-[#222222] text-white border-transparent':'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                    {c === 'TODAS' ? 'Todo Período' : c}
                  </button>
                ))}
              </div>
            </div>

            {/* Totalizador */}
            <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">{modalGroups.length} NCMs</span>
              <span className="text-sm font-bold text-slate-700">Total: R$ {fBRL(modalTotalFat)}</span>
            </div>

            {/* Lista de produtos */}
            <div className="overflow-y-auto flex-1 p-4 space-y-1">
              {modalGroups.length === 0
                ? <p className="text-center text-slate-400 py-10 text-sm">Nenhum produto nesta faixa para o período selecionado.</p>
                : modalGroups.map((g, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                    <span className="text-slate-300 text-xs font-bold w-7 text-right flex-shrink-0">{i+1}</span>
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-[10px] text-slate-400 mr-2">{g.ncmDisplay}</span>
                      <span className="text-sm font-bold text-slate-800">{g.nome}</span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-slate-800 text-sm">R$ {fBRL(g.faturamento)}</div>
                      <div className="text-[10px] text-slate-400">{modalTotalFat>0?(g.faturamento/modalTotalFat*100).toFixed(1):0}% da faixa</div>
                    </div>
                  </div>
                ))
              }
            </div>

          </div>
        </div>
      )}

    </div>
  );
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ABA: APURAÇÃƒO
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const ApuracaoTab = memo(({ saidasData, entradasData, creditosManuais, reformYear, cnpj, getCached, getCachedNbs, ncmConfirmacoes }) => {
  const rules = REFORM_SCHEDULE[reformYear] || { cbs: 0, ibs: 0 };
  const [filtroReducao, setFiltroReducao] = useState('TODAS'); // 'TODAS' | '0' | '60' | '100'
  const [filtroFluxoResumo, setFiltroFluxoResumo] = useState('TODOS'); // 'TODOS' | 'saida' | 'entrada'

  // â"€â"€ Categoriza cada item de saída com seu impacto e % de redução â"€â"€
  // Usa o discriminador de substâncias para resolver NCMs ambíguos (ex: cap.
  // 3002/3004) antes de calcular CBS/IBS — sem isso, produtos com redução de
  // 100% confirmada (por match literal ou decisão salva na fila de revisão)
  // caem na alíquota cheia por padrão.
  const itensSaida = useMemo(() => saidasData.map(item => {
    const { reduction } = resolveReducaoEfetiva(item.prodNCM, item.prodNome, item.prodNBS, getCached(cnpj, (item.prodNCM || '').replace(/\D/g, '').padStart(8, '0'), item.prodNome || '', null), null, getCachedNbs(cnpj, (item.prodNBS || '').replace(/\D/g, '')), ncmConfirmacoes);
    const impact = calculateReformImpact(
      item.prodValTotal, reformYear,
      item.emitUF || 'RJ', item.peerUF || 'RJ',
      'normal', 0, 'Regime Normal', item.prodNCM, item.prodNBS || '', null, false,
      item.prodCFOP || '', item.prodNome || '', reduction
    );
    return { ...item, impact, reducaoPerc: impact.reducaoPerc || 0 };
  }), [saidasData, reformYear, getCached, getCachedNbs, cnpj, ncmConfirmacoes]);

  // â"€â"€ Categoriza cada item de entrada com seu impacto e % de redução â"€â"€
  const itensEntrada = useMemo(() => entradasData.map(item => {
    const peerRegime = item.impostoDestacado?.temDados ? 'normal' : 'simples';
    const { reduction } = resolveReducaoEfetiva(item.prodNCM, item.prodNome, item.prodNBS, getCached(cnpj, (item.prodNCM || '').replace(/\D/g, '').padStart(8, '0'), item.prodNome || '', null), null, getCachedNbs(cnpj, (item.prodNBS || '').replace(/\D/g, '')), ncmConfirmacoes);
    const impact = calculateReformImpact(
      item.prodValTotal, reformYear,
      item.peerUF || 'RJ', item.emitUF || 'RJ',
      peerRegime, 0, 'Regime Normal',
      item.prodNCM, item.prodNBS || '', item.impostoDestacado || null, true,
      item.prodCFOP || '', item.prodNome || '', reduction
    );
    return { ...item, impact, reducaoPerc: impact.reducaoPerc || 0 };
  }), [entradasData, reformYear, getCached, getCachedNbs, cnpj, ncmConfirmacoes]);

 // â"€â"€ Filtra conforme seleção â"€â"€ (memoizado para referência estável)
const reducaoNumero = useMemo(() =>
    filtroReducao === 'TODAS' ? null : Number(filtroReducao),
  [filtroReducao]);

const saidasFiltradas = useMemo(() =>
    reducaoNumero === null
      ? itensSaida
      : itensSaida.filter(i => i.reducaoPerc === reducaoNumero),
  [itensSaida, reducaoNumero]);

const entradasFiltradas = useMemo(() =>
    reducaoNumero === null
      ? itensEntrada
      : itensEntrada.filter(i => i.reducaoPerc === reducaoNumero),
  [itensEntrada, reducaoNumero]);

// â"€â"€ Soma débitos (saídas filtradas) â"€â"€
const debitos = useMemo(() => saidasFiltradas.reduce(
    (acc, i) => {
      acc.cbs += i.impact?.taxes?.cbs || 0;
      acc.ibs += i.impact?.taxes?.ibs || 0;
      return acc;
    },
    { cbs: 0, ibs: 0 }
  ), [saidasFiltradas]);

// â"€â"€ Soma créditos (entradas filtradas + manuais proporcionais) â"€â"€
const cbsRate = rules.cbs;
const ibsRate = rules.ibs;
const creditos = useMemo(() => {
    const REDUCOES_APURACAO = {
  mercadorias: 1.0, insumos: 1.0, frete_pj: 1.0, energia: 1.0,
  telecom: 1.0, servicos_gerais: 1.0, ativo_imobilizado: 1.0,
  software: 1.0, vale_refeicao: 1.0,
  servicos_liberal: 0.70,
  plano_saude: 0.40, educacao_func: 0.40,
  alugueis: 0.30,
  frete_autonomo: 0, compra_usados_pf: 0,
};

    const crXML = entradasFiltradas.reduce(
      (acc, i) => {
        acc.cbs += i.impact?.taxes?.cbs || 0;
        acc.ibs += i.impact?.taxes?.ibs || 0;
        return acc;
      },
      { cbs: 0, ibs: 0 }
    );

    const crManual = reducaoNumero === null
      ? creditosManuais.reduce((acc, c) => {
          const fator = REDUCOES_APURACAO[c.categoria] ?? 1.0;
          acc.cbs += c.valor * (cbsRate / 100) * fator;
          acc.ibs += c.valor * (ibsRate / 100) * fator;
          return acc;
        }, { cbs: 0, ibs: 0 })
      : { cbs: 0, ibs: 0 };

    return { cbs: crXML.cbs + crManual.cbs, ibs: crXML.ibs + crManual.ibs };
  }, [entradasFiltradas, creditosManuais, cbsRate, ibsRate, reducaoNumero]);

  const saldo = { cbs: debitos.cbs - creditos.cbs, ibs: debitos.ibs - creditos.ibs };

  // ── Fornecedores Regime Normal: geram crédito IBS/CBS ──
  const fornecedoresRegimeNormal = useMemo(() => {
    const mapa = {};
    itensEntrada.forEach(item => {
      if (!item.impostoDestacado?.temDados) return;
      const key = item.peerCNPJ || item.peerNome || 'Desconhecido';
      if (!mapa[key]) mapa[key] = {
        cnpj: item.peerCNPJ || '', nome: item.peerNome || 'Desconhecido',
        uf: item.peerUF || '', totalCompras: 0, creditoCBS: 0, creditoIBS: 0, itens: 0,
      };
      mapa[key].totalCompras += item.prodValTotal || 0;
      mapa[key].creditoCBS  += item.impact?.taxes?.cbs || 0;
      mapa[key].creditoIBS  += item.impact?.taxes?.ibs || 0;
      mapa[key].itens       += 1;
    });
    return Object.values(mapa).sort((a, b) => b.totalCompras - a.totalCompras);
  }, [itensEntrada]);

  // ── Contagens por categoria (para os badges) ──
  const contagens = useMemo(() => {
    const count = (arr, perc) => arr.filter(i => i.reducaoPerc === perc).length;
    return {
      sem:  count(itensSaida, 0)   + count(itensEntrada, 0),
      r60:  count(itensSaida, 60)  + count(itensEntrada, 60),
      r100: count(itensSaida, 100) + count(itensEntrada, 100),
    };
  }, [itensSaida, itensEntrada]);

  const FILTROS = [
    {
      id: 'TODAS',
      label: 'Todas as Alíquotas',
      badge: itensSaida.length + itensEntrada.length,
      bg: 'bg-[#222222]',
      text: 'text-white',
      border: 'border-transparent',
      inativo: 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
    },
    {
      id: '0',
      label: 'Alíquota Cheia',
      badge: contagens.sem,
      badgeColor: 'bg-slate-200 text-slate-700',
      bg: 'bg-slate-700',
      text: 'text-white',
      border: 'border-transparent',
      inativo: 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
      dot: 'bg-slate-400',
    },
    {
      id: '60',
      label: 'Redução 60%',
      badge: contagens.r60,
      bg: 'bg-[#222222]',
      text: 'text-white',
      border: 'border-transparent',
      inativo: 'bg-white text-blue-700 border-gray-200 hover:bg-gray-50',
      dot: 'bg-[#222222]',
    },
    {
      id: '100',
      label: 'Alíquota Zero (100%)',
      badge: contagens.r100,
      bg: 'bg-emerald-600',
      text: 'text-white',
      border: 'border-transparent',
      inativo: 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50',
      dot: 'bg-emerald-500',
    },
  ];

  return (
    <div className="space-y-6">

      {/* â"€â"€ Filtros â"€â"€ */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Filtrar por Redução:</span>
        {FILTROS.map(f => {
          const ativo = filtroReducao === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFiltroReducao(f.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors shadow-sm
                ${ativo ? `${f.bg} ${f.text} ${f.border}` : f.inativo}`}
            >
              {f.dot && (
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ativo ? 'bg-white' : f.dot}`}/>
              )}
              {f.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold
                ${ativo ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                {f.badge}
              </span>
            </button>
          );
        })}
      </div>

{/* â"€â"€ Detalhe dos itens filtrados â"€â"€ */}
{filtroReducao !== 'TODAS' && (saidasFiltradas.length > 0 || entradasFiltradas.length > 0) && (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
    <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-xs uppercase flex items-center gap-2">
      <Package className="w-4 h-4"/> Itens nesta categoria
    </div>
    <div className="overflow-x-auto max-h-96 overflow-y-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-white text-slate-500 uppercase text-xs font-bold sticky top-0 shadow-sm">
          <tr>
            <th className="px-4 py-3 border-b border-slate-100">Produto</th>
            <th className="px-4 py-3 border-b border-slate-100">NCM</th>
            <th className="px-4 py-3 border-b border-slate-100">Fluxo</th>
            <th className="px-4 py-3 text-right border-b border-slate-100">Valor</th>
            <th className="px-4 py-3 text-right border-b border-slate-100 text-red-600">Débito CBS+IBS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {[
            ...saidasFiltradas.map(i => ({ ...i, _fluxo: 'Saída' })),
            ...entradasFiltradas.map(i => ({ ...i, _fluxo: 'Entrada' }))
          ].map((item, idx) => {
            const reducaoInfo = item.impact?.reducaoInfo;
            return (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-700 max-w-xs truncate" title={item.prodNome}>
                  {item.prodNome}
                  {reducaoInfo && (
                    <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded border font-bold
                      ${reducaoInfo.reducao === 100 ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-gray-100 text-blue-700 border-gray-300'}`}>
                      {reducaoInfo.anexo}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.prodNCM}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-bold
                    ${item._fluxo === 'Saída' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                    {item._fluxo}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  R$ {(item.prodValTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-right font-bold text-red-600">
                  R$ {((item.impact?.taxes?.cbs || 0) + (item.impact?.taxes?.ibs || 0)).toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
)}

{/* â"€â"€ Rótulo do filtro ativo â"€â"€ */}
{filtroReducao !== 'TODAS' && (
  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-bold w-fit
    ${filtroReducao === '0'   ? 'bg-slate-50 border-slate-300 text-slate-600' : ''}
    ${filtroReducao === '60'  ? 'bg-gray-50 border-gray-200 text-blue-700'    : ''}
    ${filtroReducao === '100' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : ''}`}>
    {filtroReducao === '0'   && 'ðŸ"Š Exibindo apenas itens com alíquota IBS/CBS cheia (sem redução)'}
    {filtroReducao === '60'  && '↓ Exibindo apenas itens com redução de 60% nas alíquotas (LC 214/2025)'}
    {filtroReducao === '100' && '✓" Exibindo apenas itens com alíquota zero / isenção total (LC 214/2025)'}
    <button onClick={() => setFiltroReducao('TODAS')} className="ml-2 opacity-60 hover:opacity-100">✕</button>
  </div>
)}

      {/* â"€â"€ Cards de débito / crédito / saldo â"€â"€ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Débitos */}
        <div className={`bg-white p-6 rounded-xl border shadow-sm
          ${filtroReducao === '0'   ? 'border-slate-300' :
            filtroReducao === '60'  ? 'border-gray-200'  :
            filtroReducao === '100' ? 'border-emerald-200' : 'border-red-200'}`}>
          <h3 className="text-red-700 font-bold uppercase text-xs mb-4 flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4"/> Débitos (Saídas)
            
           <span className="ml-1 text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded border border-red-200">
  {saidasFiltradas.length} itens
</span>
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span>CBS:</span><span className="font-bold">R$ {debitos.cbs.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span>IBS:</span><span className="font-bold">R$ {debitos.ibs.toFixed(2)}</span></div>
            <div className="border-t pt-2 mt-2 font-black text-lg text-red-600 flex justify-between">
              <span>Total:</span><span>R$ {(debitos.cbs + debitos.ibs).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Créditos */}
        <div className={`bg-white p-6 rounded-xl border shadow-sm
          ${filtroReducao === '0'   ? 'border-slate-300' :
            filtroReducao === '60'  ? 'border-gray-200'  :
            filtroReducao === '100' ? 'border-emerald-200' : 'border-emerald-200'}`}>
          <h3 className="text-emerald-700 font-bold uppercase text-xs mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4"/> Créditos (Entradas{filtroReducao === 'TODAS' ? ' + Manuais' : ''})
            <span className="ml-1 text-[9px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-200">
  {entradasFiltradas.length} itens
</span>
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span>CBS:</span><span className="font-bold">R$ {creditos.cbs.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span>IBS:</span><span className="font-bold">R$ {creditos.ibs.toFixed(2)}</span></div>
            <div className="border-t pt-2 mt-2 font-black text-lg text-emerald-600 flex justify-between">
              <span>Total:</span><span>R$ {(creditos.cbs + creditos.ibs).toFixed(2)}</span>
            </div>
          </div>
          {filtroReducao !== 'TODAS' && (
            <p className="text-[9px] text-slate-400 mt-3 italic">
              * Créditos manuais não possuem NCM e só aparecem na visão "Todas as Alíquotas".
            </p>
          )}
        </div>

        {/* Saldo */}
        <div className={`p-6 rounded-xl border shadow-md
          ${(saldo.cbs + saldo.ibs) > 0 ? 'bg-slate-50 border-slate-300' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className="text-slate-700 font-bold uppercase text-xs mb-4">
            Saldo a {(saldo.cbs + saldo.ibs) > 0 ? 'Pagar' : 'Recuperar'}
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between font-bold text-sm"><span>CBS:</span><span>R$ {Math.abs(saldo.cbs).toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-sm"><span>IBS:</span><span>R$ {Math.abs(saldo.ibs).toFixed(2)}</span></div>
            <div className="border-t border-slate-200 pt-2 mt-2 font-black text-2xl flex justify-between">
              <span>Total:</span><span>R$ {Math.abs(saldo.cbs + saldo.ibs).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* â"€â"€ Tabela comparativa por categoria (só na visão TODAS) â"€â"€ */}
      {filtroReducao === 'TODAS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="font-bold text-slate-700 text-xs uppercase flex items-center gap-2">
              <Scale className="w-4 h-4"/> Resumo por Categoria de Alíquota
            </div>
            <div className="flex bg-white p-1 rounded-lg border border-slate-200">
              {[
                { id: 'TODOS',   label: 'Saídas + Entradas' },
                { id: 'saida',   label: 'Somente Saídas' },
                { id: 'entrada', label: 'Somente Entradas' },
              ].map(f => (
                <button key={f.id} onClick={() => setFiltroFluxoResumo(f.id)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-colors ${filtroFluxoResumo === f.id ? 'bg-[#222222] text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-slate-500 uppercase text-xs font-bold sticky top-0">
              <tr>
                <th className="px-5 py-3 border-b border-slate-100">Categoria</th>
                <th className="px-5 py-3 border-b border-slate-100 text-center">Itens</th>
                <th className="px-5 py-3 border-b border-slate-100 text-right text-slate-600">Faturamento Total</th>
                {filtroFluxoResumo !== 'entrada' && <th className="px-5 py-3 border-b border-slate-100 text-right text-red-600">Débito CBS+IBS</th>}
                {filtroFluxoResumo !== 'saida' && <th className="px-5 py-3 border-b border-slate-100 text-right text-emerald-600">Crédito CBS+IBS</th>}
                {filtroFluxoResumo === 'TODOS' && <th className="px-5 py-3 border-b border-slate-100 text-right text-slate-700">Saldo</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { label: 'Alíquota Cheia (sem redução)', perc: 0, dotColor: 'bg-slate-400' },
                { label: 'Redução 60% (LC 214/2025)',    perc: 60, dotColor: 'bg-[#222222]' },
                { label: 'Alíquota Zero / Isenção 100%', perc: 100, dotColor: 'bg-emerald-500' },
              ].map(({ label, perc, dotColor }) => {
                const saidaFilt   = filtroFluxoResumo === 'entrada' ? [] : itensSaida.filter(i => i.reducaoPerc === perc);
                const entradaFilt = filtroFluxoResumo === 'saida'   ? [] : itensEntrada.filter(i => i.reducaoPerc === perc);
                const deb  = saidaFilt.reduce((a, i) => a + i.impact.taxes.cbs + i.impact.taxes.ibs, 0);
                const cred = entradaFilt.reduce((a, i) => a + i.impact.taxes.cbs + i.impact.taxes.ibs, 0);
                const sal  = deb - cred;
                const fat  = saidaFilt.reduce((a, i) => a + (i.prodValTotal || 0), 0)
                           + entradaFilt.reduce((a, i) => a + (i.prodValTotal || 0), 0);
                const totalItens = saidaFilt.length + entradaFilt.length;
                if (totalItens === 0) return null;
                return (
                  <tr key={perc} className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => setFiltroReducao(String(perc))}>
                    <td className="px-5 py-3 font-medium text-slate-700 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotColor}`}/>
                      {label}
                    </td>
                    <td className="px-5 py-3 text-center text-slate-500 font-bold">{totalItens}</td>
                    <td className="px-5 py-3 text-right text-slate-600 font-semibold">
                      R$ {fat.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    {filtroFluxoResumo !== 'entrada' && <td className="px-5 py-3 text-right font-bold text-red-600">R$ {deb.toFixed(2)}</td>}
                    {filtroFluxoResumo !== 'saida' && <td className="px-5 py-3 text-right font-bold text-emerald-600">R$ {cred.toFixed(2)}</td>}
                    {filtroFluxoResumo === 'TODOS' && (
                      <td className={`px-5 py-3 text-right font-black ${sal > 0 ? 'text-slate-700' : 'text-blue-600'}`}>
                        R$ {Math.abs(sal).toFixed(2)}
                        <span className="text-[9px] font-normal ml-1">{sal > 0 ? 'a pagar' : 'a recuperar'}</span>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="px-5 py-2.5 text-[10px] text-slate-400 border-t border-slate-100">
            Alíquota Zero: débito e crédito de CBS/IBS são R$ 0,00 por definição (isenção total). O faturamento é exibido para conferência do volume classificado.
          </p>
        </div>
      )}

      {/* Fornecedores em Regime Normal - Geram Credito IBS/CBS */}
      {fornecedoresRegimeNormal.length > 0 && (
        <div className="bg-white rounded-xl border border-emerald-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-emerald-50 border-b border-emerald-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600"/>
              <span className="font-bold text-emerald-800 text-xs uppercase tracking-wide">
                Fornecedores em Regime Normal &mdash; Geram Cr&eacute;dito IBS/CBS
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                {fornecedoresRegimeNormal.length} fornecedor{fornecedoresRegimeNormal.length !== 1 ? 'es' : ''}
              </span>
            </div>
            <span className="text-xs font-black text-emerald-700">
              Cr&eacute;dito total estimado: R$ {fornecedoresRegimeNormal.reduce((a, f) => a + f.creditoCBS + f.creditoIBS, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-slate-500 uppercase text-[10px] font-bold sticky top-0 shadow-sm">
                <tr>
                  <th className="px-4 py-3 border-b border-slate-100">Fornecedor</th>
                  <th className="px-4 py-3 border-b border-slate-100">CNPJ</th>
                  <th className="px-4 py-3 border-b border-slate-100 text-center">UF</th>
                  <th className="px-4 py-3 border-b border-slate-100 text-center">Itens</th>
                  <th className="px-4 py-3 border-b border-slate-100 text-right">Total Compras</th>
                  <th className="px-4 py-3 border-b border-slate-100 text-right text-blue-700">Cr&eacute;d. CBS</th>
                  <th className="px-4 py-3 border-b border-slate-100 text-right text-blue-700">Cr&eacute;d. IBS</th>
                  <th className="px-4 py-3 border-b border-slate-100 text-right text-emerald-700">Total Cr&eacute;dito</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fornecedoresRegimeNormal.map((f, idx) => (
                  <tr key={idx} className="hover:bg-emerald-50/60 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800 max-w-[220px] truncate" title={f.nome}>{f.nome}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{f.cnpj || '—'}</td>
                    <td className="px-4 py-3 text-center"><span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">{f.uf || '—'}</span></td>
                    <td className="px-4 py-3 text-center text-slate-500 text-xs">{f.itens}</td>
                    <td className="px-4 py-3 text-right text-slate-600 text-xs">R$ {f.totalCompras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right font-bold text-blue-700 text-xs">R$ {f.creditoCBS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right font-bold text-blue-700 text-xs">R$ {f.creditoIBS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right font-black text-emerald-700">R$ {(f.creditoCBS + f.creditoIBS).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-emerald-50 border-t-2 border-emerald-200">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-xs font-black text-emerald-800 uppercase">Total Geral</td>
                  <td className="px-4 py-3 text-right font-black text-slate-800 text-xs">R$ {fornecedoresRegimeNormal.reduce((a, f) => a + f.totalCompras, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-right font-black text-blue-700 text-xs">R$ {fornecedoresRegimeNormal.reduce((a, f) => a + f.creditoCBS, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-right font-black text-blue-700 text-xs">R$ {fornecedoresRegimeNormal.reduce((a, f) => a + f.creditoIBS, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-right font-black text-emerald-700">R$ {fornecedoresRegimeNormal.reduce((a, f) => a + f.creditoCBS + f.creditoIBS, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="px-4 py-3 bg-emerald-50/50 border-t border-emerald-100">
            <p className="text-[10px] text-emerald-700 leading-relaxed">
              <strong>Como identificamos:</strong> fornecedores cujas NF-e destacam ICMS/PIS/COFINS
              est&atilde;o no Regime Normal e gerar&atilde;o cr&eacute;dito de IBS+CBS na Reforma Tribut&aacute;ria (LC 214/2025).
              Fornecedores do Simples Nacional n&atilde;o destacam tributos e n&atilde;o geram cr&eacute;dito.
            </p>
          </div>
        </div>
      )}

      {fornecedoresRegimeNormal.length === 0 && entradasData.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0"/>
          <div>
            <p className="text-xs font-bold text-amber-800">Nenhum fornecedor em Regime Normal identificado</p>
            <p className="text-[10px] text-amber-700 mt-1">Todos os fornecedores parecem ser do Simples Nacional e n&atilde;o gerar&atilde;o cr&eacute;dito de IBS/CBS.</p>
          </div>
        </div>
      )}    </div>
  );
});
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ABA: PAINEL INTELIGENTE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const PainelInteligenteTab = memo(({ saidasData, entradasData, simplesRate, taxaOculta, setTaxaOculta, empresaRegime, setEmpresaRegime, reformYear, onGerarDemo, isBatchProcessing, cnpj, getCached }) => {
  const rules = REFORM_SCHEDULE[reformYear] || { cbs: 0, ibs: 0 };
  const kpis = useMemo(() => {
    const receitaXML = saidasData.reduce((acc, curr) => acc + curr.prodValTotal, 0);
    const receitaReal = taxaOculta < 100 ? receitaXML / (1 - (taxaOculta / 100)) : receitaXML;
    const valorOculto = receitaReal - receitaXML;
    const cmv = entradasData.reduce((acc, curr) => acc + curr.prodValTotal, 0);
    const das = receitaXML * (simplesRate / 100);
    const lucroBruto = receitaXML - cmv - das;
    let ibsCbsDebito = 0;
    if (empresaRegime === 'normal') {
      saidasData.forEach(item => {
        // Saída: Origem é o emitente, Destino é o peer
        const ncmNorm = (item.prodNCM || '').replace(/\D/g, '').padStart(8, '0');
        const { reduction } = resolveReducaoEfetiva(item.prodNCM, item.prodNome, item.prodNBS, getCached(cnpj, ncmNorm, item.prodNome || '', null), null);
        const impact = calculateReformImpact(item.prodValTotal, reformYear, item.emitUF || 'RJ', item.peerUF || 'RJ', 'normal', 0, 'Regime Normal', item.prodNCM, item.prodNBS || '', null, false, item.prodCFOP || '', item.prodNome || '', reduction);
        ibsCbsDebito += impact.taxes.cbs + impact.taxes.ibs;
      });
    }
    const ibsCbsSimples = empresaRegime === 'simples' ? receitaXML * ((rules.cbs + rules.ibs) / 100) : ibsCbsDebito;
    const pagamentos = {};
    saidasData.forEach(item => { const p = item.formaPagamento || 'Não Informado'; pagamentos[p] = (pagamentos[p] || 0) + item.prodValTotal; });
    const pagamentosArr = Object.entries(pagamentos).sort((a,b) => b[1] - a[1]);
    const clientes = {};
    saidasData.forEach(item => { const nome = item.peerNome || 'Desconhecido'; clientes[nome] = (clientes[nome] || 0) + item.prodValTotal; });
    const topCliente = Object.entries(clientes).sort((a, b) => b[1] - a[1])[0];
    const concentracaoTop1 = receitaXML > 0 && topCliente ? (topCliente[1] / receitaXML) * 100 : 0;
    const produtosMap = {};
    saidasData.forEach(item => { if (!produtosMap[item.prodNome]) produtosMap[item.prodNome] = { nome: item.prodNome, unit: item.prodUnit, price: item.prodValUnit, rev: 0 }; produtosMap[item.prodNome].rev += item.prodValTotal; });
    const premiumProducts = Object.values(produtosMap).sort((a, b) => b.price - a.price).slice(0, 5);
    return { receitaXML, receitaReal, valorOculto, cmv, das, lucroBruto, topCliente, concentracaoTop1, premiumProducts, pagamentosArr, ibsCbsSimples };
  }, [saidasData, entradasData, simplesRate, taxaOculta, empresaRegime, reformYear, rules, getCached, cnpj]);

  const fmtBRL = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtPct = (v) => `${(v || 0).toFixed(1)}%`;
  if (saidasData.length === 0) return <EmptyState onGerarDemo={onGerarDemo} isBatchProcessing={isBatchProcessing}/>;
  const impostoEstimado = empresaRegime === 'simples' ? kpis.das : kpis.receitaXML * 0.15;
  const impostoLabel = empresaRegime === 'simples' ? `DAS (${simplesRate}%)` : 'PIS/COFINS/ICMS est.';

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-5 rounded-xl border border-slate-700 flex flex-col md:flex-row gap-6 items-center shadow-lg">
        <div className="text-white">
          <h3 className="font-bold text-lg flex items-center gap-2"><Target className="w-5 h-5 text-[#D9C14A]"/> Setup do Cliente</h3>
          <p className="text-xs text-slate-400">Ajuste a realidade do cliente para simular a DRE com precisão.</p>
        </div>
        <div className="flex flex-wrap gap-4 flex-1">
        <div className="bg-slate-800 p-3 rounded-lg border border-slate-600 flex-1 min-w-[200px]">
  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">Regime Tributário</label>
  <span className={`text-sm font-bold px-3 py-1.5 rounded border block mt-1 w-fit ${
    empresaRegime === 'simples'
      ? 'bg-emerald-900/50 text-emerald-300 border-emerald-700'
      : 'bg-black/50 text-gray-400 border-gray-700'
  }`}>
    {empresaRegime === 'simples' ? '✓" Simples Nacional' : '✓" Regime Normal'}
  </span>
</div>
          <div className="bg-slate-800 p-3 rounded-lg border border-slate-600 flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1 flex justify-between">
              <span>Faturamento Fora da Nota</span><span className="text-[#94a3b8]">{taxaOculta}%</span>
            </label>
            <input type="range" min="0" max="90" step="5" value={taxaOculta} onChange={e => setTaxaOculta(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#D9C14A]"/>
          </div>
        </div>
      </div>

      <div className={`p-4 rounded-xl border-2 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between ${empresaRegime === 'normal' ? 'bg-gray-50 border-gray-300' : 'bg-slate-50 border-slate-300'}`}>
        <div>
          <p className="text-xs font-bold uppercase text-slate-500 mb-1 flex items-center gap-1">
            <Zap className="w-3 h-3"/> IBS + CBS estimado ({reformYear}) — {empresaRegime === 'normal' ? 'Regime Normal (apuração por débito/crédito)' : `Simples Nacional (alíquota flat ${(rules.cbs + rules.ibs).toFixed(1)}%)`}
          </p>
          <p className={`text-2xl font-black ${empresaRegime === 'normal' ? 'text-blue-700' : 'text-slate-700'}`}>{fmtBRL(kpis.ibsCbsSimples)}</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className={`text-center px-4 py-2 rounded-lg border ${empresaRegime === 'normal' ? 'bg-white border-gray-200' : 'bg-white border-slate-200'}`}>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">CBS</span>
            <span className="font-black text-lg text-slate-700">{rules.cbs.toFixed(1)}%</span>
          </div>
          <div className={`text-center px-4 py-2 rounded-lg border ${empresaRegime === 'normal' ? 'bg-white border-gray-200' : 'bg-white border-slate-200'}`}>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">IBS</span>
            <span className="font-black text-lg text-slate-700">{rules.ibs.toFixed(1)}%</span>
          </div>
          <div className={`text-center px-4 py-2 rounded-lg border ${empresaRegime === 'normal' ? 'bg-gray-100 border-gray-300' : 'bg-slate-100 border-slate-300'}`}>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Total</span>
            <span className="font-black text-lg text-slate-700">{(rules.cbs + rules.ibs).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><span className="text-xs font-bold text-slate-500 uppercase">Receita Fiscal (XML)</span><div className="text-xl font-black text-slate-700 mt-1">{fmtBRL(kpis.receitaXML)}</div></div>
        <div className={`p-4 rounded-xl border ${taxaOculta > 0 ? 'bg-[#D9C14A] border-[#B8A030] text-white shadow-md transform scale-105' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
          <span className="text-xs font-bold uppercase flex items-center gap-1"><Zap className="w-3 h-3"/> Receita Gerencial</span>
          <div className="text-xl font-black mt-1">{fmtBRL(kpis.receitaReal)}</div>
          {taxaOculta > 0 && <div className="text-[10px] bg-white/20 px-2 py-0.5 rounded mt-1 font-bold">+ {fmtBRL(kpis.valorOculto)} não declarado</div>}
        </div>
        <div className="bg-red-50 p-4 rounded-xl border border-red-100"><span className="text-xs font-bold text-red-500 uppercase flex items-center gap-1"><TrendingDown className="w-3 h-3"/> CMV</span><div className="text-xl font-black text-red-700 mt-1">-{fmtBRL(kpis.cmv)}</div></div>
        <div className="bg-slate-100 p-4 rounded-xl border border-slate-200"><span className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1"><Percent className="w-3 h-3"/> Impostos Atuais</span><div className="text-xl font-black text-slate-700 mt-1">-{fmtBRL(impostoEstimado)}</div><span className="text-[9px] text-slate-500 block">{impostoLabel}</span></div>
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 ring-1 ring-emerald-100 shadow-sm"><span className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-1"><Target className="w-3 h-3"/> Resultado Bruto</span><div className="text-xl font-black text-emerald-700 mt-1">{fmtBRL(kpis.lucroBruto)}</div></div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-600"/> Meios de Recebimento</h3>
        <div className="flex gap-4 flex-wrap">
          {kpis.pagamentosArr.length > 0 ? kpis.pagamentosArr.map(([forma, valor], idx) => {
            const pct = (valor / kpis.receitaXML) * 100;
            return (
              <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex-1 min-w-[180px]">
                <div className="text-xs font-bold text-slate-500 uppercase mb-2">{forma}</div>
                <div className="text-xl font-black text-[#222222]">{fmtBRL(valor)}</div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden"><div className="bg-green-500 h-full rounded-full" style={{width: `${pct}%`}}></div></div>
                <div className="text-[10px] text-slate-400 font-bold mt-1 text-right">{pct.toFixed(1)}%</div>
              </div>
            );
          }) : <div className="text-sm text-slate-400">Nenhuma forma de pagamento identificada.</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500"/> Alertas &amp; Risco</h3>
          {kpis.concentracaoTop1 > 30 ? (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 flex gap-3 items-start">
              <Users className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"/>
              <div>
                <h4 className="font-bold text-amber-800 text-sm">Alta Concentração de Receita</h4>
                <p className="text-xs text-amber-700 mt-1">O cliente <strong>{kpis.topCliente[0]}</strong> representa <strong>{fmtPct(kpis.concentracaoTop1)}</strong> do faturamento ({fmtBRL(kpis.topCliente[1])}).</p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 flex gap-3 items-center">
              <CheckCircle className="w-5 h-5 text-emerald-600"/>
              <span className="font-bold text-emerald-800 text-sm">Receita bem distribuída entre os clientes.</span>
            </div>
          )}
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-indigo-500"/> Top Produtos Premium (Maior Ticket)</h3>
          <div className="space-y-3">
            {kpis.premiumProducts.map((p, i) => (
              <div key={i} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2 last:border-0">
                <span className="font-medium text-slate-600 truncate mr-2">{p.nome}</span>
                <div className="font-bold text-[#222222]">{fmtBRL(p.price)} <span className="text-[10px] text-slate-400 font-normal">/{p.unit}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

const SimplesNacionalTab = ({
  reformYear, saidasData = [], entradasData = [], creditosManuais = [],
  mainTab, setMainTab,
  rbt12Raw, setRbt12Raw,
  segmentos, setSegmentos,
  autoDetectSeg, setAutoDetectSeg,
  simplesRate = 0,
  cnpj,
  getCached: getCachedSimples,
  getCachedNbs,
  ncmConfirmacoes,
}) => {

const CFOPS_ST = new Set([
  // â"€â"€â"€ Intraestadual (5400s) â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  '5403',  // venda — contribuinte substituto
  '5404',  // venda — ICMS-ST já retido anteriormente
  '5405',  // venda — contribuinte substituído  ← já estava
  '5408',  // transferência — contribuinte substituído
  '5409','5410',  // devoluções de compra com ST
  '5411','5412',  // devoluções de compra para revenda com ST
  '5413','5414',  // devoluções de venda (substituto / substituído)
  '5415','5416',  // devoluções de venda mercadoria adquirida de terceiros

  // â"€â"€â"€ Interestadual (6400s) â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  '6403',  // venda — contribuinte substituto (interestad.)
  '6404',  // venda — ICMS-ST já retido anteriormente  ← ESTAVA FALTANDO
  '6405',  // venda — contribuinte substituído (interestad.)  ← já estava
  '6408',  // transferência — contribuinte substituído (interestad.)
  '6409','6410',  // devoluções de compra interestad. com ST
  '6411','6412',  // devoluções de compra p/ revenda interestad. com ST
  '6413','6414',  // devoluções de venda (substituto / substituído)
  '6415','6416',  // devoluções de venda mercadoria adquirida de terceiros

  // â"€â"€â"€ Exportação â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  '7403',
]);
  const parseVal = s => parseFloat((s||'0').replace(/[^\d,]/g,'').replace(',','.')) || 0;
  const fmtR = v => (v||0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });

  const anoTabela = SIMPLES_DB[reformYear] ? reformYear
    : Object.keys(SIMPLES_DB).sort().reverse().find(a => a <= reformYear) || '2027';
  const stAplicavel = Number(anoTabela) <= 2032;

  const [regimeCaixa, setRegimeCaixa] = useState(false);

  const addSeg = () => {
    if (segmentos.length >= 4) return;
    setSegmentos(p => [...p, { id: Date.now(), anexo: 'anexo1', fatRaw: '', caixaRaw: '', showST: false, secaoIRaw: '', secaoIIRaw: '', issRetRaw: '' }]);
  };
  const removeSeg = id => { if (segmentos.length > 1) setSegmentos(p => p.filter(s => s.id !== id)); };
  const updSeg = (id, f, v) => setSegmentos(p => p.map(s => s.id === id ? {...s, [f]: v} : s));

  const ANEXOS_SERVICO = new Set(['anexo3', 'anexo4', 'anexo5']);

  const autoDetect = (segId) => {
    if (!saidasData.length) return;
    const seg = segmentos.find(s => s.id === segId);
    const isServico = ANEXOS_SERVICO.has(seg?.anexo);

    if (isServico) {
      // Serviços: soma apenas itens NFS-e
      const nfseItens = saidasData.filter(i => i.tipoDoc === 'NFSe');
      const total = nfseItens.reduce((acc, i) => acc + (i.prodValTotal || 0), 0);
      if (total <= 0) return;
      // ISS retido pelo tomador (tpRetISSQN=2 no XML) — essa fatia de receita
      // é excluída do percentual de ISS no cálculo do DAS (ver calcSeg).
      const issRet = nfseItens
        .filter(i => i.issRetido)
        .reduce((acc, i) => acc + (i.prodValTotal || 0), 0);
      setSegmentos(p => p.map(s => s.id === segId ? {
        ...s,
        fatRaw: total.toLocaleString('pt-BR', {minimumFractionDigits:2}),
        showST: false,
        issRetRaw: issRet > 0 ? issRet.toLocaleString('pt-BR', {minimumFractionDigits:2}) : '',
      } : s));
    } else {
      // Comércio / Indústria: soma NF-e com CFOPs de venda — exclui remessas/retornos sem incidência
      let r1 = 0, r2 = 0;
      saidasData
        .filter(i => i.tipoDoc !== 'NFSe' && !CFOPS_SEM_INCIDENCIA.has((i.prodCFOP||'').trim()))
        .forEach(item => {
          if (CFOPS_ST.has((item.prodCFOP||'').trim())) r2 += item.prodValTotal || 0;
          else r1 += item.prodValTotal || 0;
        });
      const total = r1 + r2;
      if (total <= 0) return;
      setSegmentos(p => p.map(s => s.id === segId ? {
        ...s,
        fatRaw: total.toLocaleString('pt-BR', {minimumFractionDigits:2}),
        showST: true,
        secaoIRaw: r1.toLocaleString('pt-BR', {minimumFractionDigits:2}),
        secaoIIRaw: r2.toLocaleString('pt-BR', {minimumFractionDigits:2})
      } : s));
    }
    setAutoDetectSeg(segId);
  };

  // Re-executa o auto-detect quando a competência muda (saidasData é re-filtrado no pai)
  useEffect(() => {
    if (autoDetectSeg !== null && saidasData.length > 0) {
      autoDetect(autoDetectSeg);
    }
  // Intencionalmente só depende de saidasData — re-roda quando os dados mudam
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saidasData]);

  // Confronto IBS/CBS para o Por Fora
  const confronto = useMemo(() => {
    const rules = REFORM_SCHEDULE[reformYear] || { cbs:0, ibs:0 };
    let dCbs=0, dIbs=0, cCbs=0, cIbs=0;
    saidasData.forEach(item => {
      const ncmNorm = (item.prodNCM || '').replace(/\D/g, '').padStart(8, '0');
      const { reduction } = resolveReducaoEfetiva(item.prodNCM, item.prodNome, item.prodNBS, getCachedSimples(cnpj, ncmNorm, item.prodNome || '', null), null, getCachedNbs(cnpj, (item.prodNBS || '').replace(/\D/g, '')), ncmConfirmacoes);
      const imp = calculateReformImpact(item.prodValTotal, reformYear, item.emitUF||'RJ', item.peerUF||'RJ', 'normal', 0, 'Regime Normal', item.prodNCM, item.prodNBS||'', null, false, item.prodCFOP||'', item.prodNome||'', reduction);
      dCbs += imp.taxes.cbs; dIbs += imp.taxes.ibs;
    });
    entradasData.forEach(item => {
      const regime = item.impostoDestacado?.temDados ? 'normal' : 'simples';
      const ncmNorm = (item.prodNCM || '').replace(/\D/g, '').padStart(8, '0');
      const { reduction } = resolveReducaoEfetiva(item.prodNCM, item.prodNome, item.prodNBS, getCachedSimples(cnpj, ncmNorm, item.prodNome || '', null), null, getCachedNbs(cnpj, (item.prodNBS || '').replace(/\D/g, '')), ncmConfirmacoes);
      const imp = calculateReformImpact(item.prodValTotal, reformYear, item.peerUF||'RJ', item.emitUF||'RJ', regime, 0, 'Regime Normal', item.prodNCM, item.prodNBS||'', item.impostoDestacado||null, true, item.prodCFOP||'', item.prodNome||'', reduction);
      cCbs += imp.taxes.cbs; cIbs += imp.taxes.ibs;
    });
    const REDS = { alugueis:0.30, servicos:0.70 };
    creditosManuais.forEach(c => {
      const f = REDS[c.categoria] ?? 1.0;
      cCbs += c.valor * (rules.cbs/100) * f;
      cIbs += c.valor * (rules.ibs/100) * f;
    });
    const saldoTotal = (dCbs - cCbs) + (dIbs - cIbs);
    return { debito:{cbs:dCbs,ibs:dIbs}, credito:{cbs:cCbs,ibs:cIbs}, saldo:{cbs:dCbs-cCbs,ibs:dIbs-cIbs}, total:saldoTotal };
  }, [saidasData, entradasData, creditosManuais, reformYear, getCachedSimples, getCachedNbs, cnpj, ncmConfirmacoes]);

  // Cálculo principal
  const resultado = useMemo(() => {
    const rbt12 = parseVal(rbt12Raw);
    if (rbt12 <= 0) return null;

    const calcSeg = seg => {
      const tab = SIMPLES_DB[anoTabela]?.[seg.anexo];
      if (!tab) return null;
      const fat = parseVal(seg.fatRaw);
      if (fat <= 0) return null;

      const fi = tab.faixas.findIndex(f => rbt12 <= f.limite);
      const faixaIdx = fi >= 0 ? fi : tab.faixas.length - 1;
      const faixa = tab.faixas[faixaIdx];
      const aliqEf = (rbt12 * faixa.nominal - faixa.deducao) / rbt12;
      const icmsIdx = tab.tributos.indexOf('ICMS');
      const ibsIdx  = tab.tributos.indexOf('IBS');
      const cbsIdx  = tab.tributos.indexOf('CBS');

      const calcSecao = (receita, noICMS, noIBSCBS) => {
        if (receita <= 0) return { das:0, breakdown: tab.tributos.map(n=>({nome:n,rep:0,valor:0})) };
        const dasBruto = receita * aliqEf;
        const bd = tab.tributos.map((nome, i) => {
          let rep = faixa.rep[i] || 0;
          if (noICMS && i === icmsIdx) rep = 0;
          if (noIBSCBS && (i === ibsIdx || i === cbsIdx)) rep = 0;
          return { nome, rep, valor: dasBruto * rep };
        });
        return { das: bd.reduce((s,b)=>s+b.valor, 0), breakdown: bd };
      };

      const hasST = stAplicavel && seg.showST && (parseVal(seg.secaoIRaw)>0 || parseVal(seg.secaoIIRaw)>0);
      const r1 = hasST ? parseVal(seg.secaoIRaw) : fat;
      const r2 = hasST ? parseVal(seg.secaoIIRaw) : 0;

      const sI_d  = calcSecao(hasST ? r1 : fat, false, false);
      const sII_d = calcSecao(r2, true, false);
      const sI_f  = calcSecao(hasST ? r1 : fat, false, true);
      const sII_f = calcSecao(r2, true, true);

      const mkBD = (sI, sII) => tab.tributos.map((nome, i) => ({
        nome, rep: faixa.rep[i]||0,
        valor: (sI.breakdown[i]?.valor||0) + (sII.breakdown[i]?.valor||0)
      }));

      // ISS retido na fonte pelo tomador (tpRetISSQN=2 no XML): a legislação do
      // Simples Nacional exclui o percentual de ISS do DAS para essa fatia de
      // receita, já que o município já recebeu o tributo diretamente do tomador.
      const issIdx = tab.tributos.indexOf('ISS');
      const issRetRevenue = Math.min(parseVal(seg.issRetRaw), fat);
      const issRetDeduzido = (issIdx >= 0 && issRetRevenue > 0)
        ? issRetRevenue * aliqEf * (faixa.rep[issIdx] || 0)
        : 0;

      return {
        id:seg.id, anexo:seg.anexo, tab, faixa, faixaIdx, aliqEf,
        fat, r1, r2, hasST,
        das_d: Math.max(0, sI_d.das + sII_d.das - issRetDeduzido),
        das_f: Math.max(0, sI_f.das + sII_f.das - issRetDeduzido),
        issRetDeduzido,
        bd_d: mkBD(sI_d, sII_d),
        bd_f: mkBD(sI_f, sII_f),
        sI_d, sII_d, sI_f, sII_f
      };
    };

    const segs = segmentos.map(calcSeg).filter(Boolean);
    if (!segs.length) return null;
    return {
      segs,
      totalFat:   segs.reduce((s,r)=>s+r.fat,   0),
      totalDas_d: segs.reduce((s,r)=>s+r.das_d, 0),
      totalDas_f: segs.reduce((s,r)=>s+r.das_f, 0),
      anoTabela
    };
  }, [rbt12Raw, segmentos, reformYear, anoTabela, stAplicavel]);

  // Export Excel
  const exportExcel = async () => {
    if (!resultado) return;
    const XLSX = await import('xlsx');
    const rbt12 = parseVal(rbt12Raw);
    const wb = XLSX.utils.book_new();

    // Aba 1: Resumo
    const resumo = [
      { 'Campo': 'RBT12 (12 meses)',           'Valor': rbt12 },
      { 'Campo': 'Ano Simulado',                'Valor': resultado.anoTabela },
      { 'Campo': 'Total Faturamento Mês',       'Valor': Number(resultado.totalFat.toFixed(2)) },
      { 'Campo': '',                            'Valor': '' },
      { 'Campo': 'DAS — Simples Por Dentro',    'Valor': Number(resultado.totalDas_d.toFixed(2)) },
      { 'Campo': 'DAS — Simples Por Fora',      'Valor': Number(resultado.totalDas_f.toFixed(2)) },
      { 'Campo': '',                            'Valor': '' },
      { 'Campo': 'Débito CBS (Saídas)',         'Valor': Number(confronto.debito.cbs.toFixed(2)) },
      { 'Campo': 'Débito IBS (Saídas)',         'Valor': Number(confronto.debito.ibs.toFixed(2)) },
      { 'Campo': 'Crédito CBS (Entradas)',      'Valor': Number(confronto.credito.cbs.toFixed(2)) },
      { 'Campo': 'Crédito IBS (Entradas)',      'Valor': Number(confronto.credito.ibs.toFixed(2)) },
      { 'Campo': 'Saldo IBS+CBS a Recolher',   'Valor': Number(Math.max(confronto.total, 0).toFixed(2)) },
      { 'Campo': '',                            'Valor': '' },
      { 'Campo': 'TOTAL (Por Fora + IBS/CBS)', 'Valor': Number((resultado.totalDas_f + Math.max(confronto.total, 0)).toFixed(2)) },
    ];
    resultado.segs.forEach((seg, i) => {
      resumo.push({ 'Campo': `--- Segmento ${i+1}: ${seg.tab.nome} ---`, 'Valor': '' });
      resumo.push({ 'Campo': 'Faturamento',          'Valor': Number(seg.fat.toFixed(2)) });
      resumo.push({ 'Campo': 'Faixa',                'Valor': `${seg.faixaIdx+1}ª` });
      resumo.push({ 'Campo': 'Alíquota Nominal (%)', 'Valor': Number((seg.faixa.nominal*100).toFixed(2)) });
      resumo.push({ 'Campo': 'Alíquota Efetiva (%)', 'Valor': Number((seg.aliqEf*100).toFixed(4)) });
      resumo.push({ 'Campo': 'DAS Por Dentro',       'Valor': Number(seg.das_d.toFixed(2)) });
      resumo.push({ 'Campo': 'DAS Por Fora',         'Valor': Number(seg.das_f.toFixed(2)) });
      if (seg.hasST) {
        resumo.push({ 'Campo': 'Seção I (Sem ST)',   'Valor': Number(seg.r1.toFixed(2)) });
        resumo.push({ 'Campo': 'Seção II (ST ICMS)', 'Valor': Number(seg.r2.toFixed(2)) });
      }
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumo), 'Resumo');

    // Aba 2: Detalhamento por tributo
    const detalhes = [];
    resultado.segs.forEach(seg => {
      seg.bd_d.forEach(b => {
        detalhes.push({
          'Segmento':            seg.tab.nome,
          'Faturamento (R$)':    Number(seg.fat.toFixed(2)),
          'Faixa':              `${seg.faixaIdx+1}ª`,
          'Alíq. Nominal (%)':  Number((seg.faixa.nominal*100).toFixed(2)),
          'Alíq. Efetiva (%)':  Number((seg.aliqEf*100).toFixed(4)),
          'Tributo':             b.nome,
          'Repartição (%)':     Number((b.rep*100).toFixed(2)),
          'Valor Por Dentro (R$)': Number(b.valor.toFixed(2)),
          'Valor Por Fora (R$)':   Number((seg.bd_f.find(f=>f.nome===b.nome)?.valor||0).toFixed(2)),
          'Alíq. Efetiva Tributo (%)': Number((seg.aliqEf * b.rep * 100).toFixed(4)),
        });
      });
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detalhes), 'Por Tributo');

    // Aba 3: IBS/CBS Confronto
    const ibscbs = [
      { 'Item': 'Débito CBS (Saídas)',                'Valor (R$)': Number(confronto.debito.cbs.toFixed(2)) },
      { 'Item': 'Débito IBS (Saídas)',                'Valor (R$)': Number(confronto.debito.ibs.toFixed(2)) },
      { 'Item': 'Total Débitos',                      'Valor (R$)': Number((confronto.debito.cbs+confronto.debito.ibs).toFixed(2)) },
      { 'Item': '---',                                'Valor (R$)': '' },
      { 'Item': 'Crédito CBS (Entradas + Manuais)',   'Valor (R$)': Number(confronto.credito.cbs.toFixed(2)) },
      { 'Item': 'Crédito IBS (Entradas + Manuais)',   'Valor (R$)': Number(confronto.credito.ibs.toFixed(2)) },
      { 'Item': 'Total Créditos',                     'Valor (R$)': Number((confronto.credito.cbs+confronto.credito.ibs).toFixed(2)) },
      { 'Item': '---',                                'Valor (R$)': '' },
      { 'Item': 'Saldo CBS',                          'Valor (R$)': Number(confronto.saldo.cbs.toFixed(2)) },
      { 'Item': 'Saldo IBS',                          'Valor (R$)': Number(confronto.saldo.ibs.toFixed(2)) },
      { 'Item': 'TOTAL IBS+CBS a Recolher',           'Valor (R$)': Number(Math.max(confronto.total,0).toFixed(2)) },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ibscbs), 'IBS-CBS Confronto');

    XLSX.writeFile(wb, `simples-nacional-${resultado.anoTabela}.xlsx`);
  };

  const COR = {
    IRPJ:'bg-slate-100 text-slate-700', CSLL:'bg-slate-100 text-slate-700',
    CBS:'bg-gray-100 text-blue-700',    CPP:'bg-indigo-100 text-indigo-700',
    IPI:'bg-orange-100 text-orange-700',ICMS:'bg-red-100 text-red-700',
    ISS:'bg-amber-100 text-amber-700',  IBS:'bg-purple-100 text-purple-700',
  };

  const isFora = mainTab === 'fora';
  const totalDAS = resultado ? (isFora ? resultado.totalDas_f : resultado.totalDas_d) : 0;

  // Comparativo — valores pré-calculados para JSX limpo
  const cmpFat       = resultado ? resultado.totalFat : 0;
  const cmpDasAtual  = cmpFat * (simplesRate / 100);
  const cmpDasDentro = resultado ? resultado.totalDas_d : 0;
  const cmpDasFora   = resultado ? resultado.totalDas_f : 0;
  const cmpIbsCbs    = Math.max(confronto.total, 0);
  const cmpTotDentro = cmpDasDentro;
  const cmpTotFora   = cmpDasFora + cmpIbsCbs;
  const cmpFmtPct    = v => cmpFat > 0 ? `${(v / cmpFat * 100).toFixed(2)}% do fat.` : '';
  const cmpDelta     = (v, base) => {
    if (base <= 0) return null;
    const d = v - base;
    const p = Math.abs(d / base * 100).toFixed(1);
    return { d, p, up: d > 0 };
  };

  return (
    <div className="space-y-6">

      {/* Tabs Por Dentro / Por Fora / Comparativo */}
      <div className="flex gap-2 bg-white border border-slate-200 rounded-xl p-1 w-fit shadow-sm">
        <button onClick={() => setMainTab('dentro')}
          className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
            mainTab==='dentro' ? 'bg-[#222222] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
          }`}>
          <Percent className="w-4 h-4"/>
          Simples Por Dentro
          <span className="text-[10px] opacity-70 hidden md:inline">IBS/CBS no DAS</span>
        </button>
        <button onClick={() => setMainTab('fora')}
          className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
            mainTab==='fora' ? 'bg-emerald-700 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
          }`}>
          <Scale className="w-4 h-4"/>
          Simples Por Fora
          <span className="text-[10px] opacity-70 hidden md:inline">IBS/CBS separados</span>
        </button>
        <button onClick={() => setMainTab('comparativo')}
          className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
            mainTab==='comparativo' ? 'bg-blue-700 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
          }`}>
          <BarChart2 className="w-4 h-4"/>
          Comparativo
          <span className="text-[10px] opacity-70 hidden md:inline">3 cenários</span>
        </button>
      </div>

      {/* ─── Aba Comparativo ─── */}
      {mainTab === 'comparativo' && (
        <div className="space-y-4">
          {!resultado ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-400">
              <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-20"/>
              <p className="font-bold text-slate-500">Preencha os dados nas abas "Por Dentro" ou "Por Fora" para ver o comparativo</p>
              <p className="text-sm mt-1">RBT12 e ao menos um segmento são necessários.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500">
                Referência: <span className="font-bold text-slate-700">{fmtR(cmpFat)}</span> em faturamento no período · Ano simulado: <span className="font-bold text-slate-700">{anoTabela}</span>
              </p>

              {/* Cards dos 3 cenários */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card Atual */}
                <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="bg-slate-800 px-4 py-3 text-white">
                    <p className="text-xs font-black uppercase tracking-wide opacity-80">DAS hoje ({simplesRate}%)</p>
                    <p className="text-base font-black">Atual</p>
                  </div>
                  <div className="bg-white px-4 py-4 space-y-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-500 font-semibold">DAS</span>
                      <span className="text-lg font-black text-slate-800">{fmtR(cmpDasAtual)}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 -mt-2 text-right">{cmpFmtPct(cmpDasAtual)}</p>
                    <div className="flex justify-between items-baseline border-t border-slate-100 pt-2">
                      <span className="text-xs text-slate-500 font-semibold">IBS/CBS</span>
                      <span className="text-sm font-bold text-slate-300">R$ 0,00</span>
                    </div>
                    <div className="rounded-lg px-3 py-2.5 bg-slate-50 border-t-2 border-slate-300">
                      <p className="text-[10px] font-bold uppercase mb-0.5 text-slate-500">Total</p>
                      <p className="text-2xl font-black text-slate-800">{fmtR(cmpDasAtual)}</p>
                    </div>
                  </div>
                </div>

                {/* Card Por Dentro */}
                <div className="rounded-xl border border-slate-300 overflow-hidden shadow-sm">
                  <div className="bg-[#222222] px-4 py-3 text-white">
                    <p className="text-xs font-black uppercase tracking-wide opacity-80">IBS/CBS no DAS</p>
                    <p className="text-base font-black">Simples Por Dentro</p>
                  </div>
                  <div className="bg-white px-4 py-4 space-y-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-500 font-semibold">DAS</span>
                      <span className="text-lg font-black text-slate-800">{fmtR(cmpDasDentro)}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 -mt-2 text-right">{cmpFmtPct(cmpDasDentro)}</p>
                    <div className="flex justify-between items-baseline border-t border-slate-100 pt-2">
                      <span className="text-xs text-slate-500 font-semibold">IBS/CBS</span>
                      <span className="text-xs font-bold text-slate-400 italic">embutido no DAS</span>
                    </div>
                    <div className="rounded-lg px-3 py-2.5 bg-slate-900 border-t-2 border-[#222222]">
                      <p className="text-[10px] font-bold uppercase mb-0.5 text-white/70">Total</p>
                      <p className="text-2xl font-black text-white">{fmtR(cmpTotDentro)}</p>
                      {cmpDelta(cmpTotDentro, cmpDasAtual) && (
                        <p className={`text-[11px] font-bold mt-1 ${cmpDelta(cmpTotDentro, cmpDasAtual).up ? 'text-red-300' : 'text-emerald-300'}`}>
                          {cmpDelta(cmpTotDentro, cmpDasAtual).up ? '▲' : '▼'} {fmtR(Math.abs(cmpDelta(cmpTotDentro, cmpDasAtual).d))} ({cmpDelta(cmpTotDentro, cmpDasAtual).up ? '+' : '-'}{cmpDelta(cmpTotDentro, cmpDasAtual).p}%) vs. atual
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Por Fora */}
                <div className="rounded-xl border border-emerald-200 overflow-hidden shadow-sm">
                  <div className="bg-emerald-700 px-4 py-3 text-white">
                    <p className="text-xs font-black uppercase tracking-wide opacity-80">IBS/CBS separado</p>
                    <p className="text-base font-black">Simples Por Fora</p>
                  </div>
                  <div className="bg-white px-4 py-4 space-y-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-500 font-semibold">DAS</span>
                      <span className="text-lg font-black text-slate-800">{fmtR(cmpDasFora)}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 -mt-2 text-right">{cmpFmtPct(cmpDasFora)}</p>
                    <div className="flex justify-between items-baseline border-t border-slate-100 pt-2">
                      <span className="text-xs text-slate-500 font-semibold">{cmpIbsCbs > 0 ? 'IBS/CBS a recolher' : 'IBS/CBS (crédito)'}</span>
                      <span className={`text-base font-black ${cmpIbsCbs <= 0 ? 'text-blue-600' : 'text-purple-700'}`}>
                        {fmtR(cmpIbsCbs > 0 ? cmpIbsCbs : Math.abs(confronto.total))}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 -mt-2 text-right">{cmpFmtPct(cmpIbsCbs)}</p>
                    <div className="rounded-lg px-3 py-2.5 bg-emerald-700 border-t-2 border-emerald-700">
                      <p className="text-[10px] font-bold uppercase mb-0.5 text-white/70">Total</p>
                      <p className="text-2xl font-black text-white">{fmtR(cmpTotFora)}</p>
                      {cmpDelta(cmpTotFora, cmpDasAtual) && (
                        <p className={`text-[11px] font-bold mt-1 ${cmpDelta(cmpTotFora, cmpDasAtual).up ? 'text-red-300' : 'text-emerald-300'}`}>
                          {cmpDelta(cmpTotFora, cmpDasAtual).up ? '▲' : '▼'} {fmtR(Math.abs(cmpDelta(cmpTotFora, cmpDasAtual).d))} ({cmpDelta(cmpTotFora, cmpDasAtual).up ? '+' : '-'}{cmpDelta(cmpTotFora, cmpDasAtual).p}%) vs. atual
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabela resumo */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
                  <BarChart2 className="w-4 h-4"/> Resumo Comparativo
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-white text-slate-400 text-xs uppercase font-bold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left">Componente</th>
                      <th className="px-4 py-3 text-right text-slate-600">Atual</th>
                      <th className="px-4 py-3 text-right text-[#222222]">Por Dentro</th>
                      <th className="px-4 py-3 text-right text-emerald-700">Por Fora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-right">
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-left text-slate-600">Faturamento</td>
                      <td className="px-4 py-3 text-slate-500">{fmtR(cmpFat)}</td>
                      <td className="px-4 py-3 text-slate-500">{fmtR(cmpFat)}</td>
                      <td className="px-4 py-3 text-slate-500">{fmtR(cmpFat)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-left text-slate-600">DAS</td>
                      <td className="px-4 py-3 font-bold text-slate-700">{fmtR(cmpDasAtual)}</td>
                      <td className="px-4 py-3 font-bold text-slate-700">{fmtR(cmpDasDentro)}</td>
                      <td className="px-4 py-3 font-bold text-slate-700">{fmtR(cmpDasFora)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-left text-slate-600">IBS/CBS</td>
                      <td className="px-4 py-3 text-slate-400">—</td>
                      <td className="px-4 py-3 text-slate-400 italic text-xs">embutido</td>
                      <td className="px-4 py-3 font-bold text-purple-700">{fmtR(cmpIbsCbs)}</td>
                    </tr>
                    <tr className="bg-slate-900 text-white font-black">
                      <td className="px-4 py-3 text-left">Total</td>
                      <td className="px-4 py-3">{fmtR(cmpDasAtual)}</td>
                      <td className="px-4 py-3">{fmtR(cmpTotDentro)}</td>
                      <td className="px-4 py-3 text-emerald-300">{fmtR(cmpTotFora)}</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="px-4 py-3 text-left text-slate-500 text-xs font-bold uppercase">% do fat.</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{cmpFmtPct(cmpDasAtual)}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{cmpFmtPct(cmpTotDentro)}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{cmpFmtPct(cmpTotFora)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Detalhe CBS/IBS — Por Fora */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-[10px] font-bold text-emerald-700 uppercase mb-1">Débito CBS+IBS</p>
                  <p className="font-black text-slate-800">{fmtR(confronto.debito.cbs + confronto.debito.ibs)}</p>
                  <p className="text-[10px] text-slate-500">CBS {fmtR(confronto.debito.cbs)} · IBS {fmtR(confronto.debito.ibs)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-emerald-700 uppercase mb-1">Crédito CBS+IBS</p>
                  <p className="font-black text-slate-800">{fmtR(confronto.credito.cbs + confronto.credito.ibs)}</p>
                  <p className="text-[10px] text-slate-500">CBS {fmtR(confronto.credito.cbs)} · IBS {fmtR(confronto.credito.ibs)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-emerald-700 uppercase mb-1">{confronto.total <= 0 ? 'Saldo a recuperar' : 'Saldo a recolher'}</p>
                  <p className={`font-black text-xl ${confronto.total <= 0 ? 'text-blue-700' : 'text-emerald-800'}`}>{fmtR(Math.abs(confronto.total))}</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Banner explicativo — só nas abas Por Dentro / Por Fora */}
      {mainTab !== 'comparativo' && (
      <div className={`px-4 py-3 rounded-xl border text-sm font-medium flex items-start gap-2 ${
        isFora ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-gray-50 border-gray-200 text-[#222222]'
      }`}>
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-current"/>
        {isFora
          ? 'DAS calculado sem IBS/CBS. Os tributos da Reforma são apurados separadamente pelo Confronto Débito/Crédito dos XMLs importados.'
          : 'DAS calculado com IBS/CBS embutidos nas tabelas da Reforma Tributária (LC 214/2025).'}
      </div>
      )}

      {mainTab !== 'comparativo' && (<>
      {/* Inputs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h4 className="font-bold text-slate-700 text-sm uppercase">Dados para Cálculo</h4>
          <button onClick={exportExcel} disabled={!resultado}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm ${
              resultado ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}>
            <FileText className="w-4 h-4"/> Exportar Excel
          </button>
        </div>

        {/* RBT12 */}
        <div className="max-w-sm">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">RBT12 — Receita Bruta 12 meses (R$)</label>
          <input type="text" inputMode="decimal" placeholder="Ex: 1.685.719,18"
            value={rbt12Raw} onChange={e => setRbt12Raw(e.target.value)}
            className="w-full p-3 text-lg font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#222222]"/>
          <p className="text-[10px] text-slate-400 mt-1">Determina a faixa e alíquota efetiva de todos os segmentos.</p>
        </div>

        {/* Segmentos */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="font-bold text-slate-600 text-xs uppercase flex items-center gap-2">
              <Layers className="w-4 h-4"/> Segmentos de Receita
              <span className="text-slate-400 font-normal">(comércio, indústria, serviços...)</span>
            </h5>
            {segmentos.length < 4 && (
              <button onClick={addSeg}
                className="flex items-center gap-2 bg-[#222222] hover:bg-[#0d0d0d] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                + Adicionar Segmento
              </button>
            )}
          </div>

          {segmentos.map((seg, si) => {
            const tabela = SIMPLES_DB[anoTabela]?.[seg.anexo];
            const hasICMS = tabela?.tributos?.includes('ICMS') ?? false;
            const showSTOption = hasICMS && stAplicavel;
            const somaST = parseVal(seg.secaoIRaw) + parseVal(seg.secaoIIRaw);
            const fatSeg = parseVal(seg.fatRaw);
            const stOk = Math.abs(somaST - fatSeg) < 0.10;

            return (
              <div key={seg.id} className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-b border-slate-200">
                  <span className="font-bold text-slate-700 text-sm">Segmento {si+1}</span>
                  {segmentos.length > 1 && (
                    <button onClick={() => removeSeg(seg.id)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors">
                      <X className="w-4 h-4"/>
                    </button>
                  )}
                </div>

                <div className="p-4 space-y-4 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Atividade / Anexo</label>
                      <select value={seg.anexo} onChange={e => updSeg(seg.id, 'anexo', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#222222] font-bold text-slate-700 text-sm">
                        <option value="anexo1">Comércio — Anexo I</option>
                        <option value="anexo2">Indústria — Anexo II</option>
                        <option value="anexo3">Serviços Geral — Anexo III</option>
                        <option value="anexo4">Serviços §5ºC — Anexo IV (sem CPP)</option>
                        <option value="anexo5">Serviços §5ºI — Anexo V (Fator R)</option>
                      </select>
                      {tabela?.obs && (
                        <p className="text-[10px] text-amber-600 mt-1 font-bold">{tabela.obs}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Faturamento do Segmento (R$)</label>
                      <input type="text" inputMode="decimal" placeholder="Ex: 241.512,52"
                        value={seg.fatRaw} onChange={e => updSeg(seg.id, 'fatRaw', e.target.value)}
                        className="w-full p-2.5 font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#222222] text-slate-800"/>
                      {ANEXOS_SERVICO.has(seg.anexo) && saidasData.some(i => i.tipoDoc === 'NFSe') && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <button onClick={() => autoDetect(seg.id)}
                            className="text-[10px] bg-violet-600 hover:bg-violet-700 text-white px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors">
                            <RefreshCw className="w-3 h-3"/> Auto-detectar NFS-e
                          </button>
                          {autoDetectSeg === seg.id && (
                            <span className="text-[10px] text-violet-600 font-bold flex items-center gap-1">
                              <CheckCircle className="w-3 h-3"/> Preenchido automaticamente pelas NFS-e
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ST toggle e inputs */}
                  {showSTOption && (
                    <div className="border border-amber-200 rounded-xl overflow-hidden">
                      <div className="bg-amber-50 px-4 py-2.5 flex items-center justify-between border-b border-amber-200 flex-wrap gap-2">
                        <span className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5"/> Substituição Tributária (ICMS-ST)
                        </span>
                        <div className="flex items-center gap-3">
                          {saidasData.length > 0 && !seg.showST && (
                            <button onClick={() => autoDetect(seg.id)}
                              className="text-[10px] bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors">
                              <RefreshCw className="w-3 h-3"/> Auto-detectar pelos XMLs
                            </button>
                          )}
                          <label className="flex items-center gap-2 cursor-pointer">
                            <div className="relative">
                              <input type="checkbox" className="sr-only"
                                checked={seg.showST}
                                onChange={e => updSeg(seg.id, 'showST', e.target.checked)}/>
                              <div className={`w-8 h-5 rounded-full transition-colors ${seg.showST ? 'bg-amber-500' : 'bg-slate-300'}`}/>
                              <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${seg.showST ? 'translate-x-3' : ''}`}/>
                            </div>
                            <span className="text-[10px] font-bold text-amber-700">Tem produtos com ST</span>
                          </label>
                        </div>
                      </div>

                      {seg.showST && (
                        <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                              Seção I — Sem ST <span className="font-normal text-slate-400">(ICMS no DAS)</span>
                            </label>
                            <input type="text" inputMode="decimal" placeholder="Ex: 19.008,95"
                              value={seg.secaoIRaw}
                              onChange={e => { updSeg(seg.id, 'secaoIRaw', e.target.value); setAutoDetectSeg(null); }}
                              className="w-full p-2.5 font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-400 text-slate-800 text-sm"/>
                            <p className="text-[10px] text-slate-400 mt-1">CFOPs: 5102, 6102...</p>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                              Seção II — ST ICMS <span className="font-normal text-slate-400">(ICMS = R$ 0)</span>
                            </label>
                            <input type="text" inputMode="decimal" placeholder="Ex: 222.503,57"
                              value={seg.secaoIIRaw}
                              onChange={e => { updSeg(seg.id, 'secaoIIRaw', e.target.value); setAutoDetectSeg(null); }}
                              className="w-full p-2.5 font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-400 text-slate-800 text-sm"/>
                            <p className="text-[10px] text-slate-400 mt-1">CFOPs: 5403, 5405, 6403, 6405...</p>
                          </div>
                          {(parseVal(seg.secaoIRaw) > 0 || parseVal(seg.secaoIIRaw) > 0) && (
                            <div className={`col-span-2 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border ${
                              stOk ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
                            }`}>
                              {stOk
                                ? <><CheckCircle className="w-4 h-4"/> Seções somam {fmtR(somaST)} — bate com o faturamento</>
                                : <><AlertTriangle className="w-4 h-4"/> Soma ({fmtR(somaST)}) ≠ faturamento ({fmtR(fatSeg)}) — diferença: {fmtR(Math.abs(somaST - fatSeg))}</>
                              }
                            </div>
                          )}
                          {autoDetectSeg === seg.id && (
                            <div className="col-span-2 text-[10px] text-amber-600 font-bold flex items-center gap-1">
                              <CheckCircle className="w-3 h-3"/> Auto-detectado pelos CFOPs dos XMLs
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ISS retido na fonte pelo tomador — abate do DAS */}
                  {ANEXOS_SERVICO.has(seg.anexo) && (tabela?.tributos?.includes('ISS') ?? false) && (
                    <div className="border border-blue-200 rounded-xl overflow-hidden">
                      <div className="bg-blue-50 px-4 py-2.5 flex items-center justify-between border-b border-blue-200 flex-wrap gap-2">
                        <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5"/> ISS Retido na Fonte pelo Tomador
                        </span>
                        {saidasData.some(i => i.tipoDoc === 'NFSe' && i.issRetido) && (
                          <button onClick={() => autoDetect(seg.id)}
                            className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors">
                            <RefreshCw className="w-3 h-3"/> Auto-detectar pelos XMLs
                          </button>
                        )}
                      </div>
                      <div className="p-4 bg-white">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Receita com ISS retido (tpRetISSQN=2) <span className="font-normal text-slate-400">(exclui ISS do DAS)</span>
                        </label>
                        <input type="text" inputMode="decimal" placeholder="Ex: 18.480,00"
                          value={seg.issRetRaw}
                          onChange={e => updSeg(seg.id, 'issRetRaw', e.target.value)}
                          className="w-full p-2.5 font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-slate-800 text-sm"/>
                        {(() => {
                          const segResultado = resultado?.segs?.find(s => s.id === seg.id);
                          if (!segResultado || !(segResultado.issRetDeduzido > 0)) return null;
                          return (
                            <p className="text-[10px] text-blue-600 mt-1.5 font-bold">
                              Dedução no DAS: {fmtR(segResultado.issRetDeduzido)}
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {!hasICMS && (
                    <div className="text-[10px] bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-emerald-700 font-bold flex items-center gap-2">
                      <CheckCircle className="w-3 h-3"/> ICMS extinto em {anoTabela} — sem separação por ST
                    </div>
                  )}
                {hasICMS && !stAplicavel && (
                  <div className="text-[10px] bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-500 font-bold flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3"/> ICMS-ST encerrado a partir de 2033
                  </div>
                )}
                </div>
              </div>
            );
          })}

          {resultado && resultado.segs.length > 1 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Total dos Segmentos:</span>
              <span className="font-black text-slate-800 text-lg">{fmtR(resultado.totalFat)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Resultado */}
      {resultado ? (
        <div className="space-y-4">

          {/* Cards de resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {resultado.segs.length === 1 ? (
              <>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Faixa Enquadrada</p>
                  <p className="text-4xl font-black text-[#222222]">{resultado.segs[0].faixaIdx + 1}ª</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Alíq. Nominal</p>
                  <p className="text-4xl font-black text-slate-700">{(resultado.segs[0].faixa.nominal*100).toFixed(2)}%</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Alíq. Efetiva</p>
                  <p className="text-3xl font-black text-slate-700">{(resultado.segs[0].aliqEf*100).toFixed(4)}%</p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Segmentos</p>
                  <p className="text-4xl font-black text-[#222222]">{resultado.segs.length}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center col-span-2">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Atividades</p>
                  <p className="text-sm font-bold text-slate-600 mt-1">
                    {resultado.segs.map(s => s.tab.nome.split('—')[0].trim()).join(' + ')}
                  </p>
                </div>
              </>
            )}
            <div className={`rounded-xl p-4 shadow-lg text-center ${isFora ? 'bg-emerald-700' : 'bg-[#222222]'}`}>
              <p className="text-[10px] font-bold uppercase text-gray-300">DAS a Recolher</p>
              <p className="text-3xl font-black text-white">{fmtR(totalDAS)}</p>
              <p className="text-[10px] text-gray-300 mt-0.5">{isFora ? 'Sem IBS/CBS' : 'Com IBS/CBS'}</p>
            </div>
          </div>

          {/* Por Fora: confronto IBS/CBS */}
          {isFora && (
            <div className="bg-white rounded-xl border border-emerald-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-emerald-50 border-b border-emerald-100 text-xs font-bold text-emerald-700 uppercase flex items-center gap-2">
                <Scale className="w-4 h-4"/> IBS/CBS — Confronto Débito/Crédito
                {(!saidasData.length && !entradasData.length) && (
                  <span className="ml-2 text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 rounded">
                    ⚠ Importe XMLs para preencher automaticamente
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                <div className="p-5">
                  <p className="text-[10px] text-red-500 font-bold uppercase mb-3 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3"/> Débitos (Saídas)
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">CBS:</span><span className="font-bold">R$ {confronto.debito.cbs.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">IBS:</span><span className="font-bold">R$ {confronto.debito.ibs.toFixed(2)}</span></div>
                    <div className="flex justify-between border-t border-slate-100 pt-2 font-black text-red-600">
                      <span>Total:</span><span>R$ {(confronto.debito.cbs+confronto.debito.ibs).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-[10px] text-emerald-600 font-bold uppercase mb-3 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3"/> Créditos (Entradas + Manuais)
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">CBS:</span><span className="font-bold">R$ {confronto.credito.cbs.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">IBS:</span><span className="font-bold">R$ {confronto.credito.ibs.toFixed(2)}</span></div>
                    <div className="flex justify-between border-t border-slate-100 pt-2 font-black text-emerald-600">
                      <span>Total:</span><span>R$ {(confronto.credito.cbs+confronto.credito.ibs).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                <p className={`text-[10px] font-bold uppercase mb-3 ${confronto.total <= 0 ? 'text-blue-600' : 'text-slate-500'}`}>
  {confronto.total <= 0 ? 'Saldo a Recuperar' : 'Saldo a Recolher'}
</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">CBS:</span><span className="font-bold">R$ {Math.abs(confronto.saldo.cbs).toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">IBS:</span><span className="font-bold">R$ {Math.abs(confronto.saldo.ibs).toFixed(2)}</span></div>
                    <div className="flex justify-between border-t border-slate-100 pt-2 font-black text-slate-700 text-base">
                      <span>IBS+CBS:</span><span>R$ {Math.abs(confronto.total).toFixed(2)}</span>
                    </div>
                  </div>
                 {confronto.total <= 0 ? (
  <div className="mt-3 space-y-2">
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
      <p className="text-[10px] text-emerald-600 font-bold uppercase mb-1">DAS a Recolher</p>
      <p className="font-black text-emerald-700 text-xl">{fmtR(resultado.totalDas_f)}</p>
    </div>
    <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
      <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0"/>
      <div>
        <p className="text-[10px] text-blue-600 font-bold uppercase">IBS/CBS — Saldo a Recuperar</p>
        <p className="font-black text-blue-700 text-lg">{fmtR(Math.abs(confronto.total))}</p>
      </div>
    </div>
  </div>
) : (
  <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
    <p className="text-[10px] text-emerald-600 font-bold uppercase mb-1">DAS + IBS/CBS Total</p>
    <p className="font-black text-emerald-700 text-xl">{fmtR(resultado.totalDas_f + confronto.total)}</p>
  </div>
)}
                </div>
              </div>
            </div>
          )}

          {/* Tabela multi-segmento */}
          {resultado.segs.length > 1 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
                <Layers className="w-4 h-4"/> Detalhamento por Segmento
              </div>
              <table className="w-full text-sm">
                <thead className="bg-white text-slate-500 text-xs uppercase font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3 text-left">Segmento</th>
                    <th className="px-5 py-3 text-right">Faturamento</th>
                    <th className="px-5 py-3 text-right">Faixa</th>
                    <th className="px-5 py-3 text-right">Alíq. Efetiva</th>
                    <th className="px-5 py-3 text-right text-[#222222]">DAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resultado.segs.map(seg => (
                    <tr key={seg.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-700">{seg.tab.nome}</td>
                      <td className="px-5 py-3 text-right text-slate-600">{fmtR(seg.fat)}</td>
                      <td className="px-5 py-3 text-right font-bold text-slate-600">{seg.faixaIdx+1}ª</td>
                      <td className="px-5 py-3 text-right text-slate-600">{(seg.aliqEf*100).toFixed(4)}%</td>
                      <td className="px-5 py-3 text-right font-black text-[#222222]">{fmtR(isFora ? seg.das_f : seg.das_d)}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#222222] text-white">
                    <td className="px-5 py-3 font-black">TOTAL DAS</td>
                    <td className="px-5 py-3 text-right font-bold">{fmtR(resultado.totalFat)}</td>
                    <td className="px-5 py-3"></td>
                    <td className="px-5 py-3"></td>
                    <td className="px-5 py-3 text-right font-black text-xl">{fmtR(totalDAS)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Detalhamento por segmento */}
          {resultado.segs.map((seg, si) => {
            const bd = isFora ? seg.bd_f : seg.bd_d;
            const dasSeg = isFora ? seg.das_f : seg.das_d;
            return (
              <div key={`detail-${seg.id}`} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h4 className="font-bold text-slate-700 text-sm uppercase mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#D9C14A]"/>
                  {resultado.segs.length > 1 ? `Segmento ${si+1} — ` : ''}
                  Repartição: {seg.tab.nome} — {seg.faixaIdx+1}ª Faixa
                </h4>

                {seg.hasST && (
                  <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-2 bg-amber-100 border-b border-amber-200 text-[10px] font-bold text-amber-700 uppercase">
                      Seções PGDAS-D
                    </div>
                    <table className="w-full text-sm">
                      <thead className="text-slate-500 text-[10px] uppercase font-bold border-b border-amber-100">
                        <tr>
                          <th className="px-4 py-2 text-left">Seção</th>
                          <th className="px-4 py-2 text-right">Receita</th>
                          <th className="px-4 py-2 text-right text-red-500">ICMS no DAS</th>
                          <th className="px-4 py-2 text-right text-[#222222]">DAS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100">
                        <tr className="hover:bg-amber-50/50">
                          <td className="px-4 py-2.5 text-slate-600">Seção I — Sem ST</td>
                          <td className="px-4 py-2.5 text-right">{fmtR(seg.r1)}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-red-600">
                            {fmtR((isFora ? seg.sI_f : seg.sI_d).breakdown.find(b=>b.nome==='ICMS')?.valor||0)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-[#222222]">{fmtR(isFora ? seg.sI_f.das : seg.sI_d.das)}</td>
                        </tr>
                        <tr className="hover:bg-amber-50/50">
                          <td className="px-4 py-2.5 text-slate-600">Seção II — ST ICMS</td>
                          <td className="px-4 py-2.5 text-right">{fmtR(seg.r2)}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-emerald-600">R$ 0,00</td>
                          <td className="px-4 py-2.5 text-right font-bold text-[#222222]">{fmtR(isFora ? seg.sII_f.das : seg.sII_d.das)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="space-y-3">
                  {bd.map(({ nome, rep, valor }) => {
                    const isIBSCBS = nome === 'IBS' || nome === 'CBS';
                    const issDeduzido = nome === 'ISS' ? Math.min(seg.issRetDeduzido || 0, valor) : 0;
                    const valorLiquido = valor - issDeduzido;
                    const pct = dasSeg > 0 ? (valorLiquido / dasSeg) * 100 : 0;
                    return (
                      <div key={nome}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${COR[nome]||'bg-slate-100 text-slate-600'}`}>{nome}</span>
                            <span className="text-xs text-slate-500">Repartição: {(rep*100).toFixed(2)}%</span>
                            {isFora && isIBSCBS && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">excluído do DAS</span>
                            )}
                            {issDeduzido > 0 && (
                              <span className="text-[9px] bg-blue-100 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-bold">
                                {issDeduzido >= valor ? 'retido na fonte — não incidência' : `R$ ${fmtR(issDeduzido)} retido na fonte`}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            {issDeduzido > 0 ? (
                              <>
                                <span className="text-xs text-slate-300 line-through mr-1.5">{fmtR(valor)}</span>
                                <span className="text-sm font-bold text-slate-800">{fmtR(valorLiquido)}</span>
                              </>
                            ) : (
                              <span className={`text-sm font-bold ${isFora && isIBSCBS ? 'text-slate-300 line-through' : 'text-slate-800'}`}>{fmtR(valor)}</span>
                            )}
                            <span className="text-[10px] text-slate-400 ml-2">Ef.: {(seg.aliqEf * rep * 100).toFixed(4)}%</span>
                          </div>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${isFora && isIBSCBS ? 'opacity-20' : ''} ${
                            nome==='CBS'?'bg-[#222222]':nome==='IBS'?'bg-purple-500':
                            nome==='CPP'?'bg-indigo-500':nome==='ICMS'?'bg-red-400':
                            nome==='ISS'?'bg-amber-400':nome==='IPI'?'bg-orange-400':'bg-slate-400'
                          }`} style={{width:`${pct}%`}}/>
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-3 border-t border-slate-100 flex justify-between font-black text-lg">
                    <span className="text-slate-600">DAS {isFora ? 'Por Fora' : 'Por Dentro'}</span>
                    <span className="text-[#222222]">{fmtR(dasSeg)}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Tabelas de faixas */}
          {resultado.segs.map((seg, si) => (
            <div key={`tabela-${seg.id}`} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase">
                Tabela {resultado.anoTabela} — {seg.tab.nome}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-white text-slate-400 uppercase font-bold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2">Faixa</th>
                      <th className="px-4 py-2">Limite RBT12</th>
                      <th className="px-4 py-2">Nominal</th>
                      <th className="px-4 py-2">Dedução</th>
                      {seg.tab.tributos.map(t => <th key={t} className="px-3 py-2">{t}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {seg.tab.faixas.map((f, i) => {
                      const ativa = i === seg.faixaIdx;
                      return (
                        <tr key={i} className={ativa ? 'bg-[#222222] text-white' : 'hover:bg-slate-50'}>
                          <td className={`px-4 py-2 font-black text-base ${ativa ? 'text-white' : 'text-slate-500'}`}>{i+1}ª</td>
                          <td className="px-4 py-2">{f.limite.toLocaleString('pt-BR',{style:'currency',currency:'BRL',notation:'compact'})}</td>
                          <td className="px-4 py-2 font-bold">{(f.nominal*100).toFixed(2)}%</td>
                          <td className="px-4 py-2">{f.deducao > 0 ? fmtR(f.deducao) : '—'}</td>
                          {f.rep.map((r,j) => <td key={j} className="px-3 py-2">{(r*100).toFixed(2)}%</td>)}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

        </div>
      ) : (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-16 text-center text-slate-400">
          <Calculator className="w-12 h-12 mx-auto mb-4 opacity-20"/>
          <p className="font-bold text-slate-500">Preencha o RBT12 e o faturamento de pelo menos um segmento</p>
          <p className="text-sm mt-1">O cálculo aparece automaticamente.</p>
        </div>
      )}
      </>)}
    </div>
  );
};
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// COMPONENTE PRINCIPAL
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const TaxAnalyzer = () => {
 const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rn_auth_session_v1')) || null; } catch (_) { return null; }
  });
  const { getCached: getCachedNcmDecisao, saveDecision: saveNcmDecisao, deleteDecision: deleteNcmDecisao, clearAllDecisions: clearAllNcmDecisoes, loading: loadingNcmDecisoes } = useNcmDecisoes(currentUser?.licenseCNPJ);
  const { getCached: getCachedNbsDecisao, saveDecision: saveNbsDecisao, loading: loadingNbsDecisoes } = useNbsDecisoes(currentUser?.licenseCNPJ);
  // Dados do Report Semestral (Contábil/DP) por período — mesmos hooks usados
  // em report/ReportPage.jsx, aqui reaproveitados pros módulos Contábil e DP
  // dentro do app principal. Cai em mock automaticamente se o Firestore não
  // tiver documento pra esse CNPJ/período (ver useReportData.js).
  const [periodoSelecionado, setPeriodoSelecionado] = useState(null);
  const { periodos: periodosDisponiveis, loading: loadingPeriodos } = usePeriodosDisponiveis(currentUser?.licenseCNPJ);
  const periodoAtualId = periodoSelecionado || periodosDisponiveis[0];
  const { data: periodoData, loading: loadingPeriodoData } = usePeriodo(currentUser?.licenseCNPJ, periodoAtualId);
  // usePeriodo nunca sai do loading=true se periodoId nunca chega a existir
  // (efeito interno dá return antes de setLoading(false) — ver useReportData.js).
  // Por isso só contamos loadingPeriodoData quando já existe um período pra buscar;
  // sem isso, um CNPJ sem nenhum período (real ou mock) ficava girando pra sempre.
  const loadingReportPeriodo = loadingPeriodos || (!!periodoAtualId && loadingPeriodoData);
  const semPeriodoParaCnpj = !loadingPeriodos && periodosDisponiveis.length === 0;
  const { periodosData: periodosDataContabil } = useMultiplosPeriodos(currentUser?.licenseCNPJ, periodosDisponiveis);
  // Confirmação/rejeição manual de NCM na Conferência — levantado para a raiz para
  // que a rejeição afete o Confronto IBS/CBS e demais telas, não só a própria aba.
  const [ncmConfirmacoes, setNcmConfirmacoes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ncm_conferencia_v1') || '{}'); }
    catch { return {}; }
  });
  const saveNcmConfirmacoes = (obj) => {
    setNcmConfirmacoes(obj);
    localStorage.setItem('ncm_conferencia_v1', JSON.stringify(obj));
  };
  const [showSplash, setShowSplash] = useState(false);
  const [loginForm, setLoginForm] = useState({ cnpj: '', regime: 'simples', aliquota: '' });
  const [activeModule, setActiveModule] = useState('fiscal');
  const [reformaSubTab, setReformaSubTab] = useState('impacto');
  const [operacoesFlow, setOperacoesFlow] = useState('saidas');
  const [operacoesTab, setOperacoesTab] = useState('lista');
  const [reformaFlow, setReformaFlow] = useState('saidas');
  const [pricingTab, setPricingTab] = useState('upload');
  const [analysisData, setAnalysisData] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [globalMargin, setGlobalMargin] = useState(20);
  const [selectedUF, setSelectedUF] = useState('RJ');
  const [simplesRate, setSimplesRate] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rn_auth_session_v1'))?.simplesRate ?? 11.44; } catch (_) { return 11.44; }
  });
  const [expandedItem, setExpandedItem] = useState(null);
  const [saidasData, setSaidasData] = useState([]);
  const [entradasData, setEntradasData] = useState([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [cnpjCache, setCnpjCache] = useState({});
  const [creditosManuais, setCreditosManuais] = useState([]);
  const [reformYear, setReformYear] = useState('2027');
  const [modoApresentacao, setModoApresentacao] = useState(false);
  const [empresaRegime, setEmpresaRegime] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rn_auth_session_v1'))?.regime ?? 'simples'; } catch (_) { return 'simples'; }
  });
  const [taxaOculta, setTaxaOculta] = useState(0);
  const [loginError, setLoginError] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [needsCompanySetup, setNeedsCompanySetup] = useState(false);
  const [showCompanySelector, setShowCompanySelector] = useState(false);
 const [showImportModal, setShowImportModal] = useState(false);
const [importProgress, setImportProgress] = useState(0);
const [importResult, setImportResult] = useState(null);
const [isImporting, setIsImporting] = useState(false);
const [importMode, setImportMode] = useState('substituir'); // ← ADICIONAR
  const [simplesMainTab, setSimplesMainTab] = useState('dentro');
const [simplesRbt12Raw, setSimplesRbt12Raw] = useState('');
const [simplesSegmentos, setSimplesSegmentos] = useState([
  { id: 1, anexo: 'anexo1', fatRaw: '', showST: false, secaoIRaw: '', secaoIIRaw: '', issRetRaw: '' }
]);
 const [selectedCompetence, setSelectedCompetence] = useState('TODAS');

const filtrarPorCompetencia = (lista) => {
  if (selectedCompetence === 'TODAS') return lista;

  return lista.filter(item => {
    if (!item.date) return false;

    const d = new Date(item.date);

    const competencia =
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    return competencia === selectedCompetence;
  });
};

const saidasFiltradas = useMemo(() => filtrarPorCompetencia(saidasData), [saidasData, selectedCompetence]);
const entradasFiltradas = useMemo(() => filtrarPorCompetencia(entradasData), [entradasData, selectedCompetence]);

// Para débitos CBS/IBS (saídas): exclui remessas/retornos sem incidência
const saidasParaApuracao = useMemo(() =>
  saidasFiltradas.filter(i => !CFOPS_SEM_INCIDENCIA.has((i.prodCFOP || '').trim())),
  [saidasFiltradas]
);
// Para CMV e créditos CBS/IBS (entradas): apenas CFOPs de compra real
const entradasParaCMV = useMemo(() =>
  entradasFiltradas.filter(i => isCFOPCompra((i.prodCFOP || '').trim())),
  [entradasFiltradas]
);

// Para Reforma: apenas CFOPs de faturamento (exclui devoluções e transferências)
const saidasFaturamento = useMemo(() =>
  saidasData.filter(i => !isCFOPSemFaturamento((i.prodCFOP || '').trim())),
  [saidasData]
);
const entradasFaturamento = useMemo(() =>
  entradasData.filter(i => !isCFOPSemFaturamento((i.prodCFOP || '').trim())),
  [entradasData]
);
const saidasFaturamentoFiltradas = useMemo(() =>
  filtrarPorCompetencia(saidasFaturamento),
  [saidasFaturamento, selectedCompetence]
);
const entradasFaturamentoFiltradas = useMemo(() =>
  filtrarPorCompetencia(entradasFaturamento),
  [entradasFaturamento, selectedCompetence]
);

 const [simplesAutoDetectSeg, setSimplesAutoDetectSeg] = useState(null);
  const [apuracaoSubTab, setApuracaoSubTab] = useState('apuracao');
  const MAPA_PAGAMENTOS = useMemo(() => ({
    '01':'Dinheiro','02':'Cheque','03':'Cartão de Crédito','04':'Cartão de Débito',
    '05':'Crédito Loja','10':'Vale Alimentação','11':'Vale Refeição','12':'Vale Presente',
    '13':'Vale Combustível','14':'Duplicata Mercantil','15':'Boleto Bancário',
    '16':'Depósito Bancário','17':'PIX','18':'Transferência Bancária','19':'Fidelidade',
   '90':'A Prazo / Faturado','99':'Outros / Não Informado'
  }), []);

useEffect(() => {
  if (activeModule === 'reforma' && reformaSubTab === 'apuracao') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setCreditosManuais(JSON.parse(saved));
    else setCreditosManuais([]);
  }
}, [activeModule, reformaSubTab, apuracaoSubTab]);

  const validateCNPJ = (xmlDoc) => {
    if (!currentUser) return { valid: false, message: '' };
    const cleanLicense = cleanCNPJ(currentUser.licenseCNPJ);
    const emit = xmlDoc.getElementsByTagName('emit')[0];
    const emitCNPJ = cleanCNPJ(safeExtract(emit, 'CNPJ'));
    const dest = xmlDoc.getElementsByTagName('dest')[0];
    const destCNPJ = dest ? cleanCNPJ(safeExtract(dest, 'CNPJ')) : '';
    const isIssuer = emitCNPJ === cleanLicense;
    const isReceiver = destCNPJ === cleanLicense;
    if (!isIssuer && !isReceiver) return { valid: false, message: `CNPJ licenciado (${currentUser.licenseCNPJ}) não encontrado neste arquivo.` };
    return { valid: true, isIssuer };
  };

  const extractImpostoDestacado = (detNode) => {
    const imposto = detNode.getElementsByTagName('imposto')[0];
    if (!imposto) return { icms: 0, fcp: 0, pis: 0, cofins: 0, ibs: 0, cbs: 0, total: 0, temDados: false, temIBSCBS: false };

    // â"€â"€ ICMS: filho variável por modalidade (ICMS00, ICMS10, ICMS20... ICMSSN400...)
    let vICMS = 0, vFCP = 0;
    const icmsBlock = imposto.getElementsByTagName('ICMS')[0];
    if (icmsBlock && icmsBlock.children.length > 0) {
      const filho = icmsBlock.children[0];
      vICMS = safeNumber(safeExtract(filho, 'vICMS'));
      // ST: emitente recolhe em nome do destinatário (CST 10, 30, 70)
      vICMS += safeNumber(safeExtract(filho, 'vICMSST'));
      // ST retido em etapa anterior (CST 60)
      vICMS += safeNumber(safeExtract(filho, 'vICMSSTRet'));
      // FCP — RJ=2%, MG=2%, BA=2%, PA=3%...
      vFCP = safeNumber(safeExtract(filho, 'vFCP'))
           + safeNumber(safeExtract(filho, 'vFCPST'))
           + safeNumber(safeExtract(filho, 'vFCPSTRet'));
    }

    // â"€â"€ PIS: filho pode ser PISAliq, PISQtde, PISNT, PISOutr
    let vPIS = 0;
    const pisBlock = imposto.getElementsByTagName('PIS')[0];
    if (pisBlock && pisBlock.children.length > 0)
      vPIS = safeNumber(safeExtract(pisBlock.children[0], 'vPIS'));

    // â"€â"€ COFINS: filho pode ser COFINSAliq, COFINSQtde, COFINSNT, COFINSOutr
    let vCOFINS = 0;
    const cofinsBlock = imposto.getElementsByTagName('COFINS')[0];
    if (cofinsBlock && cofinsBlock.children.length > 0)
      vCOFINS = safeNumber(safeExtract(cofinsBlock.children[0], 'vCOFINS'));

    // â"€â"€ IBS/CBS nativo (NF-e 2026+) — usar valor real quando disponível
    let vIBS = 0, vCBS = 0;
    const ibscbsBlock = imposto.getElementsByTagName('IBSCBS')[0];
    if (ibscbsBlock) {
      const gIBSCBS = ibscbsBlock.getElementsByTagName('gIBSCBS')[0];
      if (gIBSCBS) {
        vIBS = safeNumber(safeExtract(gIBSCBS, 'vIBS'));
        vCBS = safeNumber(safeExtract(gIBSCBS, 'vCBS'));
      }
    }

    const total = vICMS + vFCP + vPIS + vCOFINS;
    return {
      icms: vICMS, fcp: vFCP, pis: vPIS, cofins: vCOFINS,
      ibs: vIBS, cbs: vCBS,
      total,
      temDados: icmsBlock !== undefined,
      temIBSCBS: vIBS > 0 || vCBS > 0,
    };
  };
// â"€â"€â"€ IMPORTAÇÃƒO GLOBAL (XML + ZIP) â"€â"€â"€
  const handleGlobalImport = async (files) => {
    if (!files || files.length === 0) return;
    setIsImporting(true);
    setImportProgress(0);
    setImportResult(null);
    setUploadError(null);

    const xmlTexts = [];
    for (const file of files) {
      if (file.name.toLowerCase().endsWith('.zip')) {
        try {
          const zip = await JSZip.loadAsync(file);
          const xmlEntries = Object.values(zip.files).filter(
            f => f.name.toLowerCase().endsWith('.xml') && !f.dir
          );
          for (const entry of xmlEntries) {
            xmlTexts.push(await entry.async('string'));
          }
        } catch (e) { console.error('Erro ao abrir ZIP:', e); }
      } else if (file.name.toLowerCase().endsWith('.xml')) {
        xmlTexts.push(await file.text());
      }
    }

    const newSaidas = [], newEntradas = [];
    let blocked = 0;
    const cleanLicense = cleanCNPJ(currentUser.licenseCNPJ);
    const dicionarioOculto = {};
    let contadorFicticio = 1;
    let globalId = Date.now();
    let empresaNomeDetectado = null;

    const IBGE_UF = IBGE_UF_MAP;

    for (let i = 0; i < xmlTexts.length; i++) {
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlTexts[i], 'text/xml');

        // â"€â"€ NFS-e (Nota Fiscal de Serviços Eletrônica Nacional) â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
        if (xmlDoc.getElementsByTagName('infNFSe').length > 0) {
          const infNFSe = xmlDoc.getElementsByTagName('infNFSe')[0];
          const infDPS  = xmlDoc.getElementsByTagName('infDPS')[0];
          if (!infNFSe || !infDPS) { blocked++; continue; }

          const emitNFSe = infNFSe.getElementsByTagName('emit')[0];
          const prest    = infDPS.getElementsByTagName('prest')[0];
          const toma     = infDPS.getElementsByTagName('toma')[0];

          const prestCNPJ = cleanCNPJ(safeExtract(prest, 'CNPJ') || safeExtract(emitNFSe, 'CNPJ'));
          const tomaCNPJ  = toma ? cleanCNPJ(safeExtract(toma, 'CNPJ')) : '';
          const isNFSeIssuer   = prestCNPJ === cleanLicense;
          const isNFSeReceiver = tomaCNPJ  === cleanLicense;
          if (!isNFSeIssuer && !isNFSeReceiver) { blocked++; continue; }
          const isSaidaNFSe = isNFSeIssuer;

          const prestNome = safeExtract(emitNFSe, 'xNome') || 'Prestador';
          const tomaNome  = toma ? (safeExtract(toma, 'xNome') || 'Tomador') : 'Tomador';
          const prestUF   = safeExtract(emitNFSe?.getElementsByTagName('enderNac')?.[0], 'UF') || 'RJ';
          const tomaEndNac = toma?.getElementsByTagName('endNac')?.[0];
          const tomaCMun   = safeExtract(tomaEndNac, 'cMun');
          const tomaUF     = (tomaCMun ? IBGE_UF[tomaCMun.slice(0,2)] : null) || prestUF;
          if (isSaidaNFSe && !empresaNomeDetectado) {
            const nomeReal = safeExtract(emitNFSe, 'xNome');
            if (nomeReal) empresaNomeDetectado = nomeReal;
          }

          let nfsePeerCNPJ = isSaidaNFSe ? tomaCNPJ : prestCNPJ;
          let nfsePeerNome = isSaidaNFSe ? tomaNome  : prestNome;
          const nfsePeerUF = isSaidaNFSe ? tomaUF    : prestUF;

          if (modoApresentacao && nfsePeerCNPJ) {
            const cp = cleanCNPJ(nfsePeerCNPJ);
            if (!dicionarioOculto[cp]) {
              dicionarioOculto[cp] = { cnpj: `99.999.999/0001-${String(contadorFicticio).padStart(2,'0')}`, nome: `${isSaidaNFSe ? 'Cliente Fictício' : 'Fornecedor Fictício'} ${contadorFicticio}` };
              contadorFicticio++;
            }
            nfsePeerCNPJ = dicionarioOculto[cp].cnpj;
            nfsePeerNome = dicionarioOculto[cp].nome;
          }

          const servBlock  = infDPS.getElementsByTagName('serv')[0];
          const cServBlock = servBlock?.getElementsByTagName('cServ')?.[0];
          const xDescServ  = safeExtract(cServBlock, 'xDescServ') || 'Serviço';
          const cNBS       = safeExtract(cServBlock, 'cNBS');
          const cTribNac   = safeExtract(cServBlock, 'cTribNac');

          const vServPrest = infDPS.getElementsByTagName('vServPrest')[0];
          const vServ      = safeNumber(safeExtract(vServPrest, 'vServ'));
          if (vServ <= 0) continue;

          // ISS: valor efetivo vem do bloco infNFSe (processado pelo emissor nacional);
          // a retenção (tpRetISSQN: 1=não retido, 2=retido pelo tomador) vem do DPS.
          const valoresNFSe = infNFSe.getElementsByTagName('valores')[0];
          const vISSQN      = safeNumber(safeExtract(valoresNFSe, 'vISSQN'));
          const tribMun     = infDPS.getElementsByTagName('tribMun')[0];
          const tpRetISSQN  = safeExtract(tribMun, 'tpRetISSQN');
          const issRetido   = tpRetISSQN === '2';

          const nfseItem = {
            id: globalId++,
            nNF: safeExtract(infNFSe, 'nNFSe') || '1',
            peerCNPJ: nfsePeerCNPJ, peerNome: nfsePeerNome,
            peerUF: nfsePeerUF, emitUF: prestUF,
            date: safeExtract(infDPS, 'dhEmi'),
            isNFCE: false, tipoDoc: 'NFSe',
            prodNome: xDescServ, prodNCM: '',
            prodNBS: cNBS, prodCodServ: cTribNac,
            prodValUnit: vServ, prodValTotal: vServ,
            prodQty: 1, prodUnit: 'SV', prodCFOP: '',
            formaPagamento: 'Outros',
            vISSQN, issRetido,
            impostoDestacado: { icms:0, fcp:0, pis:0, cofins:0, ibs:0, cbs:0, total:0, temDados:false, temIBSCBS:false },
          };
          if (isSaidaNFSe) newSaidas.push(nfseItem); else newEntradas.push(nfseItem);
          continue; // pula o processamento NF-e abaixo
        }
        // â"€â"€ NF-e â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

        const validation = validateCNPJ(xmlDoc);
        if (!validation.valid) { blocked++; continue; }

        const ide = xmlDoc.getElementsByTagName('ide')[0];
        const emit = xmlDoc.getElementsByTagName('emit')[0];
        const dest = xmlDoc.getElementsByTagName('dest')[0];
        const nNF = safeExtract(ide, 'nNF');
       const modelo = safeExtract(ide, 'mod');
        const tpNF = safeExtract(ide, 'tpNF') ? safeExtract(ide, 'tpNF').trim() : ''; // Lê o tipo da nota (0=Entrada, 1=Saída)
        const dhEmi = safeExtract(ide, 'dhEmi');
      // DEPOIS
const emitCNPJ = cleanCNPJ(safeExtract(emit,'CNPJ'));
const destCNPJcheck = dest ? cleanCNPJ(safeExtract(dest, 'CNPJ')) : '';
const isIssuer = emitCNPJ === cleanLicense;
const isReceiver = destCNPJcheck === cleanLicense;

// Se EU sou o destinatário → sempre entrada
// Se EU sou o emitente → depende do tpNF
const isSaida = isReceiver ? false : (isIssuer ? (tpNF === '1') : false);
if (isIssuer && !empresaNomeDetectado) {
  const nomeReal = safeExtract(emit, 'xNome');
  if (nomeReal) empresaNomeDetectado = nomeReal;
}
        const emitUFReal = safeExtract(emit.getElementsByTagName('enderEmit')[0], 'UF') || 'RJ';
        const destUFReal = dest ? safeExtract(dest.getElementsByTagName('enderDest')[0], 'UF') || 'RJ' : 'RJ';
        let peerCNPJ, peerNome, peerUF;
        if (isSaida) {
          peerCNPJ = dest ? (safeExtract(dest,'CNPJ') || safeExtract(dest,'CPF') || 'Consumidor Final') : 'Consumidor Final';
          peerNome = dest ? (safeExtract(dest,'xNome') || 'Não Identificado') : 'Consumidor Final';
          const ed = dest ? dest.getElementsByTagName('enderDest')[0] : null;
          peerUF = ed ? (safeExtract(ed,'UF') || 'RJ') : 'RJ';
        } else {
          peerCNPJ = safeExtract(emit,'CNPJ');
          peerNome = safeExtract(emit,'xNome');
          peerUF = safeExtract(emit.getElementsByTagName('enderEmit')[0], 'UF') || 'RJ';
        }

        let finalPeerCNPJ = peerCNPJ, finalPeerNome = peerNome;
        if (modoApresentacao && peerCNPJ !== 'Consumidor Final') {
          const cleanPeer = cleanCNPJ(peerCNPJ);
          if (!dicionarioOculto[cleanPeer]) {
            dicionarioOculto[cleanPeer] = {
              cnpj: `99.999.999/0001-${String(contadorFicticio).padStart(2,'0')}`,
              nome: `${isSaida ? 'Cliente Fictício' : 'Fornecedor Fictício'} ${contadorFicticio}`
            };
            contadorFicticio++;
          }
          finalPeerCNPJ = dicionarioOculto[cleanPeer].cnpj;
          finalPeerNome = dicionarioOculto[cleanPeer].nome;
        }

        const dets = xmlDoc.getElementsByTagName('det');
        for (let j = 0; j < dets.length; j++) {
         const prod = dets[j].getElementsByTagName('prod')[0];
const _vProd  = safeNumber(safeExtract(prod,'vProd'));
const _vFrete = safeNumber(safeExtract(prod,'vFrete'));
const _vSeg   = safeNumber(safeExtract(prod,'vSeg'));
const _vOutro = safeNumber(safeExtract(prod,'vOutro'));
const _vDesc  = safeNumber(safeExtract(prod,'vDesc'));
const _impNdJ = dets[j].getElementsByTagName('imposto')[0];
const _ipiElsJ = _impNdJ ? _impNdJ.getElementsByTagName('vIPI') : [];
const _vIPI   = _ipiElsJ.length > 0 ? safeNumber(_ipiElsJ[0].textContent) : 0;
const valTotal = _vProd + _vFrete + _vSeg + _vOutro + _vIPI - _vDesc;
const valUnit  = safeNumber(safeExtract(prod,'vUnCom'));
const qty      = safeNumber(safeExtract(prod,'qCom'));
if (valUnit <= 0 && valTotal <= 0) continue;
const originalCFOP = safeExtract(prod,'CFOP') ? safeExtract(prod,'CFOP').trim() : '';
        let finalCFOP = originalCFOP;
    // DEPOIS
if (!isSaida && originalCFOP) {
  finalCFOP = CFOP_CONVERSION_MAP[originalCFOP] || converterCFOPEntrada(originalCFOP);
}
const pag = xmlDoc.getElementsByTagName('pag')[0];
let codPag = '99';
if (pag) { const dp = pag.getElementsByTagName('detPag')[0]; if (dp) codPag = safeExtract(dp,'tPag') || '99'; }

// ✅ ADICIONAR ESTAS DUAS LINHAS:
const formaPag = MAPA_PAGAMENTOS[codPag] || 'Outros';
const impostoDestacado = extractImpostoDestacado(dets[j]);

const item = {
  id: globalId++, nNF, peerCNPJ: finalPeerCNPJ, peerNome: finalPeerNome,
  peerUF, emitUF: isSaida ? emitUFReal : destUFReal, date: dhEmi, isNFCE: modelo==='65',
  prodNome: safeExtract(prod,'xProd'), prodNCM: safeExtract(prod,'NCM'),
  prodValUnit: valUnit, prodValTotal: valTotal > 0 ? valTotal : valUnit * qty,
  prodQty: qty, prodUnit: safeExtract(prod,'uCom') || 'UN',
  prodCFOP: finalCFOP, formaPagamento: formaPag,
  impostoDestacado
};
          if (isSaida) newSaidas.push(item); else newEntradas.push(item);
        }
    } catch (e) { console.error('Erro XML:', e); blocked++; }

     if (i % 10 === 0) {
  setImportProgress(Math.round(((i + 1) / xmlTexts.length) * 100));
  await new Promise(r => setTimeout(r, 5));
      }
    } // ← ADICIONAR AQUI para fechar o for loop

    if (empresaNomeDetectado) {
      setCurrentUser(prev => (prev && prev.name === 'Empresa') ? { ...prev, name: empresaNomeDetectado } : prev);
    }

 if (importMode === 'acrescentar') {   //
      setSaidasData(prev => {
        const ids = new Set(prev.map(i => i.id));
        return [...prev, ...newSaidas.filter(i => !ids.has(i.id))];
      });
      setEntradasData(prev => {
        const ids = new Set(prev.map(i => i.id));
        return [...prev, ...newEntradas.filter(i => !ids.has(i.id))];
      });
    } else {
      setSaidasData(newSaidas);
      setEntradasData(newEntradas);
    }
    setIsImporting(false);
    setImportResult({ saidas: newSaidas.length, entradas: newEntradas.length, blocked, total: xmlTexts.length, modo: importMode });
   if (blocked > 0) setUploadError(`${blocked} arquivo(s) bloqueado(s) por CNPJ não autorizado.`);
  };  // ← fecha handleGlobalImport

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(e.target.result, 'text/xml');
        const validation = validateCNPJ(xmlDoc);
        if (!validation.valid) { setUploadError(validation.message); return; }
        const emit = xmlDoc.getElementsByTagName('emit')[0];
        const dest = xmlDoc.getElementsByTagName('dest')[0];
        const ide = xmlDoc.getElementsByTagName('ide')[0];
        const dets = xmlDoc.getElementsByTagName('det');
        const enderEmit = emit.getElementsByTagName('enderEmit')[0];
        const ufEmitente = safeExtract(enderEmit, 'UF') || safeExtract(emit, 'UF');
        const modelo = safeExtract(ide, 'mod');
        let targetUF = ufEmitente;
        if (dest) { const ed = dest.getElementsByTagName('enderDest')[0]; const uf = safeExtract(ed, 'UF'); if (uf) targetUF = uf; }
        if (modelo === '65') targetUF = ufEmitente;
        
        if (targetUF && UF_LIST.includes(targetUF)) setSelectedUF(targetUF);
        
        setAnalysisData({
          company: { name: safeExtract(emit,'xNome'), cnpj: safeExtract(emit,'CNPJ'), state: ufEmitente || 'Desconhecido' },
          invoice: { number: safeExtract(ide,'nNF'), model: modelo },
          products: Array.from(dets).map(det => {
            const prod = det.getElementsByTagName('prod')[0];
            return {
              code: safeExtract(prod,'cProd'), description: safeExtract(prod,'xProd'),
              ncm: safeExtract(prod,'NCM'), cfop: safeExtract(prod,'CFOP'),
              quantity: safeNumber(safeExtract(prod,'qCom')), unit: safeExtract(prod,'uCom'),
              currentPrice: safeNumber(safeExtract(prod,'vUnCom')),
              isNFCE: modelo==='65', emitUF: ufEmitente
            };
          })
        });
        setPricingTab('analysis');
      } catch (err) { console.error(err); alert('Erro ao ler XML.'); }
    };
    reader.readAsText(file);
  };

  const handleBatchUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    setIsBatchProcessing(true); setUploadError(null);
    const newSaidas = [], newEntradas = [];
    let globalId = 0, blocked = 0;
    const cleanLicense = cleanCNPJ(currentUser.licenseCNPJ);
    const dicionarioOculto = {};
    let contadorFicticio = 1;
    let empresaNomeDetectado = null;
    for (const file of files) {
      const text = await file.text();
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');

        // â"€â"€ NFS-e (Nota Fiscal de Serviços Eletrônica Nacional) â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
        if (xmlDoc.getElementsByTagName('infNFSe').length > 0) {
          const infNFSe = xmlDoc.getElementsByTagName('infNFSe')[0];
          const infDPS  = xmlDoc.getElementsByTagName('infDPS')[0];
          if (!infNFSe || !infDPS) { blocked++; continue; }

          const emitNFSe = infNFSe.getElementsByTagName('emit')[0];
          const prest    = infDPS.getElementsByTagName('prest')[0];
          const toma     = infDPS.getElementsByTagName('toma')[0];

          const prestCNPJ = cleanCNPJ(safeExtract(prest, 'CNPJ') || safeExtract(emitNFSe, 'CNPJ'));
          const tomaCNPJ  = toma ? cleanCNPJ(safeExtract(toma, 'CNPJ')) : '';
          const isNFSeIssuer   = prestCNPJ === cleanLicense;
          const isNFSeReceiver = tomaCNPJ  === cleanLicense;
          if (!isNFSeIssuer && !isNFSeReceiver) { blocked++; continue; }
          const isSaidaNFSe = isNFSeIssuer;

          const prestNome = safeExtract(emitNFSe, 'xNome') || 'Prestador';
          const tomaNome  = toma ? (safeExtract(toma, 'xNome') || 'Tomador') : 'Tomador';
          const prestUF   = safeExtract(emitNFSe?.getElementsByTagName('enderNac')?.[0], 'UF') || 'RJ';
          const tomaEndNac = toma?.getElementsByTagName('endNac')?.[0];
          const tomaCMun   = safeExtract(tomaEndNac, 'cMun');
          const tomaUF     = (tomaCMun ? IBGE_UF_MAP[tomaCMun.slice(0,2)] : null) || prestUF;
          if (isSaidaNFSe && !empresaNomeDetectado) {
            const nomeReal = safeExtract(emitNFSe, 'xNome');
            if (nomeReal) empresaNomeDetectado = nomeReal;
          }

          let nfsePeerCNPJ = isSaidaNFSe ? tomaCNPJ : prestCNPJ;
          let nfsePeerNome = isSaidaNFSe ? tomaNome  : prestNome;
          const nfsePeerUF = isSaidaNFSe ? tomaUF    : prestUF;

          if (modoApresentacao && nfsePeerCNPJ) {
            const cp = cleanCNPJ(nfsePeerCNPJ);
            if (!dicionarioOculto[cp]) {
              dicionarioOculto[cp] = { cnpj: `99.999.999/0001-${String(contadorFicticio).padStart(2,'0')}`, nome: `${isSaidaNFSe ? 'Cliente Fictício' : 'Fornecedor Fictício'} ${contadorFicticio}` };
              contadorFicticio++;
            }
            nfsePeerCNPJ = dicionarioOculto[cp].cnpj;
            nfsePeerNome = dicionarioOculto[cp].nome;
          }

          const servBlock  = infDPS.getElementsByTagName('serv')[0];
          const cServBlock = servBlock?.getElementsByTagName('cServ')?.[0];
          const xDescServ  = safeExtract(cServBlock, 'xDescServ') || 'Serviço';
          const cNBS       = safeExtract(cServBlock, 'cNBS');
          const cTribNac   = safeExtract(cServBlock, 'cTribNac');

          const vServPrest = infDPS.getElementsByTagName('vServPrest')[0];
          const vServ      = safeNumber(safeExtract(vServPrest, 'vServ'));
          if (vServ <= 0) { blocked++; continue; }

          const valoresNFSe = infNFSe.getElementsByTagName('valores')[0];
          const vISSQN      = safeNumber(safeExtract(valoresNFSe, 'vISSQN'));
          const tribMun     = infDPS.getElementsByTagName('tribMun')[0];
          const tpRetISSQN  = safeExtract(tribMun, 'tpRetISSQN');
          const issRetido   = tpRetISSQN === '2';

          const nfseItem = {
            id: globalId++,
            nNF: safeExtract(infNFSe, 'nNFSe') || '1',
            peerCNPJ: nfsePeerCNPJ, peerNome: nfsePeerNome,
            peerUF: nfsePeerUF, emitUF: prestUF,
            date: safeExtract(infDPS, 'dhEmi'),
            isNFCE: false, tipoDoc: 'NFSe',
            prodNome: xDescServ, prodNCM: '',
            prodNBS: cNBS, prodCodServ: cTribNac,
            prodValUnit: vServ, prodValTotal: vServ,
            prodQty: 1, prodUnit: 'SV', prodCFOP: '',
            formaPagamento: 'Outros',
            vISSQN, issRetido,
            impostoDestacado: { icms:0, fcp:0, pis:0, cofins:0, ibs:0, cbs:0, total:0, temDados:false, temIBSCBS:false },
          };
          if (isSaidaNFSe) newSaidas.push(nfseItem); else newEntradas.push(nfseItem);
          continue;
        }
        // â"€â"€ NF-e â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

        const validation = validateCNPJ(xmlDoc);
        if (!validation.valid) { blocked++; continue; }
        const ide = xmlDoc.getElementsByTagName('ide')[0];
        const emit = xmlDoc.getElementsByTagName('emit')[0];
        const dest = xmlDoc.getElementsByTagName('dest')[0];
       const nNF = safeExtract(ide,'nNF');
        const modelo = safeExtract(ide,'mod');
        const tpNF = safeExtract(ide, 'tpNF') ? safeExtract(ide, 'tpNF').trim() : '';
        const dhEmi = safeExtract(ide,'dhEmi');
        const emitCNPJ = cleanCNPJ(safeExtract(emit,'CNPJ'));
        const isIssuer = emitCNPJ === cleanLicense;
        const isSaida = isIssuer ? (tpNF === '1') : false;
        if (isIssuer && !empresaNomeDetectado) {
          const nomeReal = safeExtract(emit, 'xNome');
          if (nomeReal) empresaNomeDetectado = nomeReal;
        }

        const emitUFReal = safeExtract(emit.getElementsByTagName('enderEmit')[0], 'UF') || 'RJ';
        const destUFReal = dest ? safeExtract(dest.getElementsByTagName('enderDest')[0], 'UF') || 'RJ' : 'RJ';

        let peerCNPJ, peerNome, peerUF;
        if (isSaida) {
          peerCNPJ = dest ? (safeExtract(dest,'CNPJ') || safeExtract(dest,'CPF') || 'Consumidor Final') : 'Consumidor Final';
          peerNome = dest ? (safeExtract(dest,'xNome') || 'Não Identificado') : 'Consumidor Final';
          const ed = dest ? dest.getElementsByTagName('enderDest')[0] : null;
          peerUF = ed ? (safeExtract(ed,'UF') || 'RJ') : 'RJ';
        } else {
          peerCNPJ = safeExtract(emit,'CNPJ');
          peerNome = safeExtract(emit,'xNome');
          peerUF = safeExtract(emit.getElementsByTagName('enderEmit')[0], 'UF') || 'RJ';
        }
        let finalPeerCNPJ = peerCNPJ, finalPeerNome = peerNome;
        if (modoApresentacao && peerCNPJ !== 'Consumidor Final') {
          const cleanPeer = cleanCNPJ(peerCNPJ);
          if (!dicionarioOculto[cleanPeer]) {
            dicionarioOculto[cleanPeer] = {
              cnpj: `99.999.999/0001-${String(contadorFicticio).padStart(2, '0')}`,
              nome: `${isSaida ? 'Cliente Fictício' : 'Fornecedor Fictício'} ${contadorFicticio}`
            };
            contadorFicticio++;
          }
          finalPeerCNPJ = dicionarioOculto[cleanPeer].cnpj;
          finalPeerNome = dicionarioOculto[cleanPeer].nome;
        }
        const dets = xmlDoc.getElementsByTagName('det');
        for (let i = 0; i < dets.length; i++) {
          const prod = dets[i].getElementsByTagName('prod')[0];
          const _vProdI  = safeNumber(safeExtract(prod,'vProd'));
          const _vFreteI = safeNumber(safeExtract(prod,'vFrete'));
          const _vSegI   = safeNumber(safeExtract(prod,'vSeg'));
          const _vOutroI = safeNumber(safeExtract(prod,'vOutro'));
          const _vDescI  = safeNumber(safeExtract(prod,'vDesc'));
          const _impNdI  = dets[i].getElementsByTagName('imposto')[0];
          const _ipiElsI = _impNdI ? _impNdI.getElementsByTagName('vIPI') : [];
          const _vIPII   = _ipiElsI.length > 0 ? safeNumber(_ipiElsI[0].textContent) : 0;
          const valTotal = _vProdI + _vFreteI + _vSegI + _vOutroI + _vIPII - _vDescI;
          const valUnit = safeNumber(safeExtract(prod,'vUnCom'));
          const qty = safeNumber(safeExtract(prod,'qCom'));
          if (valUnit > 0 || valTotal > 0) {
           const originalCFOP = safeExtract(prod,'CFOP') ? safeExtract(prod,'CFOP').trim() : '';
            let finalCFOP = originalCFOP;
         // DEPOIS
if (!isSaida && originalCFOP) finalCFOP = CFOP_CONVERSION_MAP[originalCFOP] || converterCFOPEntrada(originalCFOP);
            const pag = xmlDoc.getElementsByTagName('pag')[0];
            let codPag = '99';
            if (pag) { const detPag = pag.getElementsByTagName('detPag')[0]; if (detPag) codPag = safeExtract(detPag, 'tPag') || '99'; }
            const formaPag = MAPA_PAGAMENTOS[codPag] || 'Outros';

            const impostoDestacado = extractImpostoDestacado(dets[i]);

            const item = {
              id: globalId++, nNF, peerCNPJ: finalPeerCNPJ, peerNome: finalPeerNome,
             peerUF, 
emitUF: isSaida ? emitUFReal : destUFReal,
date: dhEmi, 
isNFCE: modelo==='65',
              prodNome: safeExtract(prod,'xProd'), prodNCM: safeExtract(prod,'NCM'),
              prodValUnit: valUnit, prodValTotal: valTotal > 0 ? valTotal : valUnit * qty,
              prodQty: qty, prodUnit: safeExtract(prod,'uCom') || 'UN',
              prodCFOP: finalCFOP, formaPagamento: formaPag,
              impostoDestacado
            };
            if (isSaida) newSaidas.push(item); else newEntradas.push(item);
          }
        }
      } catch (e) { console.error("Erro ao processar arquivo:", e); }
    }
    if (blocked > 0) setUploadError(`Atenção: ${blocked} arquivo(s) bloqueado(s) por CNPJ não autorizado.`);
    if (empresaNomeDetectado) {
      setCurrentUser(prev => (prev && prev.name === 'Empresa') ? { ...prev, name: empresaNomeDetectado } : prev);
    }
    setSaidasData(newSaidas);
    setEntradasData(newEntradas);
    setIsBatchProcessing(false);
  };

  const loadMockData = () => {
    setAnalysisData({ company: { name:'JB TEXTIL DEMO', state:'RJ' }, invoice: { number:'1126', model:'55' }, products: [
      { code:'1172', description:'TULE BORDADO CORAÇÃƒO', ncm:'58042100', cfop:'5102', currentPrice:3.25, isNFCE:false, emitUF:'RJ' },
      { code:'586', description:'RENDA FLORDELIS JBTEX', ncm:'60024020', cfop:'5405', currentPrice:56.90, isNFCE:true, emitUF:'RJ' }
    ]});
    setSelectedUF('RJ'); setSimplesRate(11.44); setPricingTab('analysis');
  };

    const carregarDemoCompleta = () => {
    setIsBatchProcessing(true);
    const produtosMock = [
  { nome: 'CAFE PILAO TRADICIONAL 250GR ALMOFADA - 01X250GR', ncm: '09012100', unit: 'un', price: 8.90 },
  { nome: 'MOLHO BARBECUE HEMMER FRASCO 1KG - 01X1KG', ncm: '21039091', unit: 'un', price: 24.50 },
  { nome: 'NUTELLA T140GR - 01X140GR', ncm: '18069000', unit: 'un', price: 15.90 },
  { nome: 'MAIONESE HEINZ FRASCO ALHO 215G', ncm: '21039011', unit: 'un', price: 12.80 },
  { nome: 'KETCHUP TRADICIONAL QUERO FRAS 397G', ncm: '21032010', unit: 'un', price: 9.90 },
  { nome: 'FERRERO ROCHER T8X10X2 - 01X80G', ncm: '18069000', unit: 'cx', price: 42.00 },
  { nome: 'WAFER BAUDUCCO CHOCOLATE 140G', ncm: '19053200', unit: 'un', price: 6.50 },
  { nome: 'FARINHA DE TRIGO ESPECIAL 5KG', ncm: '11010010', unit: 'un', price: 14.90 },
  { nome: 'COOKIES BAUDUCCO ORIGINAL 100G', ncm: '19053100', unit: 'un', price: 5.80 },
  { nome: 'REFRESCO MID LARANJA 20GR', ncm: '21069010', unit: 'un', price: 1.50 },
];
    const nomesSaida = [
      'Supermercado Bom Preço Ltda',
      'Atacadão do Vale Comércio',
      'Mercearia Central ME',
      'Rede Supermercados Norte',
      'Varejão Família Ltda',
    ];
    const nomesEntrada = [
      'Café Pilão Indústria S/A',
      'Hemmer Condimentos Ltda',
      'Ferrero do Brasil Ltda',
      'Bauducco Alimentos S/A',
      'Heinz Brasil Indústria',
    ];
    const ufs = ['RJ', 'SP', 'MG', 'ES', 'PR'];
    const cfopsSaida = ['5102', '5403', '6102'];
    const cfopsEntrada = ['1102', '1403', '2102'];
    const gerarLote = (isSaida, quantidade) => {
      const lote = [];
      let idBase = isSaida ? 1000 : 5000;
      for (let i = 0; i < quantidade; i++) {
        const prod = produtosMock[Math.floor(Math.random() * produtosMock.length)];
        const empresa = isSaida ? nomesSaida[Math.floor(Math.random() * nomesSaida.length)] : nomesEntrada[Math.floor(Math.random() * nomesEntrada.length)];
        const uf = ufs[Math.floor(Math.random() * ufs.length)];
        const qty = Math.floor(Math.random() * 50) + 1;
        const dia = Math.floor(Math.random() * 28) + 1;
        const dateStr = `2026-02-${String(dia).padStart(2, '0')}T10:00:00-03:00`;
        const cnpjFicticio = `99${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}0001${String(Math.floor(Math.random() * 99)).padStart(2, '0')}`;
        const isNormal = Math.random() > 0.4;
        const totalVal = prod.price * qty;
        const impostoDestacado = (!isSaida && isNormal) ? {
          icms: totalVal * 0.12, pis: totalVal * 0.0165, cofins: totalVal * 0.076,
          total: totalVal * (0.12 + 0.0165 + 0.076), temDados: true
        } : { icms: 0, pis: 0, cofins: 0, total: 0, temDados: false };

        lote.push({
          id: idBase++, nNF: String(Math.floor(Math.random() * 9000) + 1000),
          peerCNPJ: cnpjFicticio, peerNome: empresa, peerUF: uf, emitUF: 'RJ',
          date: dateStr, isNFCE: Math.random() > 0.8,
          prodNome: prod.nome, prodNCM: prod.ncm, prodValUnit: prod.price,
          prodValTotal: totalVal, prodQty: qty, prodUnit: prod.unit,
          prodCFOP: isSaida ? cfopsSaida[Math.floor(Math.random() * cfopsSaida.length)] : cfopsEntrada[Math.floor(Math.random() * cfopsEntrada.length)],
          impostoDestacado
        });
        setCnpjCache(prev => ({ ...prev, [cnpjFicticio]: isNormal ? 'Regime Normal' : 'Simples Nacional' }));
      }
      return lote.sort((a, b) => a.date.localeCompare(b.date));
    };
    setTimeout(() => {
      setSaidasData(gerarLote(true, 150));
      setEntradasData(gerarLote(false, 60));
      setIsBatchProcessing(false);
      alert("✅ Base de demonstração gerada com sucesso!");
      setActiveModule('reforma');
    }, 1200);
  };

const fmtCNPJ = (v) => {
  const n = v.replace(/\D/g, '').slice(0, 14);
  return n
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

const handleEntrada = (e) => {
  e.preventDefault();
  const cnpjLimpo = (loginForm.cnpj || '').replace(/\D/g, '');
  if (cnpjLimpo.length !== 14) { setLoginError('CNPJ inválido. Digite os 14 dígitos.'); return; }
  if (loginForm.regime === 'simples' && (!loginForm.aliquota || isNaN(parseFloat(loginForm.aliquota)))) {
    setLoginError('Informe a alíquota do Simples Nacional.'); return;
  }
  const user = { name: 'Empresa', licenseCNPJ: cnpjLimpo, active: true };
  const rate = loginForm.regime === 'simples' ? parseFloat(loginForm.aliquota) : 0;
  setCurrentUser(user);
  setEmpresaRegime(loginForm.regime);
  setSimplesRate(rate);
  setLoginError('');
  try {
    localStorage.setItem('rn_auth_session_v1', JSON.stringify({ ...user, regime: loginForm.regime, simplesRate: rate }));
  } catch (_) {}
};
if (!currentUser) {
  return (
    <div className="min-h-screen flex font-sans">
      {/* Painel esquerdo — identidade RN */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-[#222222] p-12">
        <div>
          <div className="flex flex-col items-start mb-16">
            <img src={logoRN} alt="RN Contabilidade" className="h-36 w-auto rounded"/>
          </div>
          <h2 className="text-4xl font-black text-white leading-tight">
            Sistema de<br/>
            <span className="text-[#D9C14A]">Análise Fiscal</span><br/>
            Tributária
          </h2>
          <p className="text-gray-400 mt-6 leading-relaxed text-sm max-w-xs">
            Reforma Tributária LC 214/2025 · Simples Nacional · Apuração IBS/CBS · Triagem de Carteira NCM
          </p>
        </div>
        <div>
          <div className="h-px bg-white/10 mb-6"/>
          <p className="text-gray-500 text-xs">RN Contabilidade © 2026 · Desenvolvido por Felipe Schott · v4.3.0</p>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="flex lg:hidden flex-col items-center mb-10">
            <img src={logoRN} alt="RN Contabilidade" className="h-20 w-auto rounded"/>
          </div>

          <h1 className="text-2xl font-black text-[#222222] mb-1">Bem-vindo</h1>
          <p className="text-slate-400 text-sm mb-8">Acesse o sistema de análise tributária</p>

          <form onSubmit={handleEntrada} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">CNPJ da Empresa</label>
              <input
                type="text"
                className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#D9C14A] focus:border-[#D9C14A] outline-none font-medium text-slate-700 shadow-sm"
                placeholder="00.000.000/0000-00"
                maxLength={18}
                value={loginForm.cnpj}
                onChange={e => setLoginForm({ ...loginForm, cnpj: fmtCNPJ(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Regime Tributário</label>
              <div className="flex gap-2">
                {[
                  { value: 'simples', label: 'Simples Nacional' },
                  { value: 'normal',  label: 'Regime Normal' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setLoginForm({ ...loginForm, regime: opt.value, aliquota: '' })}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${loginForm.regime === opt.value ? 'border-[#222222] bg-[#222222] text-white shadow-md' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {loginForm.regime === 'simples' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Alíquota do Simples Nacional (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" step="0.01" min="0" max="33" placeholder="ex: 11.44"
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#D9C14A] focus:border-[#D9C14A] outline-none font-medium text-slate-700 shadow-sm"
                    value={loginForm.aliquota}
                    onChange={e => setLoginForm({ ...loginForm, aliquota: e.target.value })}
                  />
                  <span className="text-slate-400 font-bold text-lg">%</span>
                </div>
              </div>
            )}

            {loginError && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2 border border-red-100">
                <ShieldAlert className="w-4 h-4"/> {loginError}
              </div>
            )}

            <button type="submit"
              className="w-full bg-[#D9C14A] hover:bg-[#B8A030] text-white font-black py-4 rounded-xl flex justify-center items-center gap-2 shadow-lg transition-all active:scale-95 text-sm uppercase tracking-wider">
              Acessar Sistema <ArrowUpRight className="w-5 h-5"/>
            </button>
          </form>

          <p className="text-center text-[10px] text-slate-300 mt-8">RN Contabilidade © 2026 · Felipe Schott</p>
        </div>
      </div>
    </div>
  );
}


// Relatório de regimes tributários de clientes e fornecedores — junta todo mundo
// que já apareceu em alguma nota (saída = cliente, entrada = fornecedor) com o
// regime já consultado em cnpjCache (ou "Não consultado" se ainda não buscou).
const exportarRelatorioRegimes = async () => {
  const XLSX = await import('xlsx');
  const mapa = {};
  const addPeer = (item, tipo) => {
    const cnpj = cleanCNPJ(item.peerCNPJ);
    if (!cnpj || cnpj.length !== 14 || cnpj === '00000000000000') return;
    if (!mapa[cnpj]) mapa[cnpj] = { cnpj, nome: item.peerNome || '', uf: item.peerUF || '', cliente: false, fornecedor: false, faturamentoCliente: 0, faturamentoFornecedor: 0 };
    if (tipo === 'cliente') { mapa[cnpj].cliente = true; mapa[cnpj].faturamentoCliente += item.prodValTotal || 0; }
    else { mapa[cnpj].fornecedor = true; mapa[cnpj].faturamentoFornecedor += item.prodValTotal || 0; }
    if (item.peerNome) mapa[cnpj].nome = item.peerNome;
    if (item.peerUF) mapa[cnpj].uf = item.peerUF;
  };
  saidasData.forEach(item => addPeer(item, 'cliente'));
  entradasData.forEach(item => addPeer(item, 'fornecedor'));

  const linhas = Object.values(mapa)
    .sort((a, b) => (b.faturamentoCliente + b.faturamentoFornecedor) - (a.faturamentoCliente + a.faturamentoFornecedor))
    .map(p => ({
      'CNPJ': fmtCNPJ(p.cnpj),
      'Nome': p.nome,
      'UF': p.uf,
      'Tipo': p.cliente && p.fornecedor ? 'Cliente e Fornecedor' : p.cliente ? 'Cliente' : 'Fornecedor',
      'Regime Tributário': cnpjCache[p.cnpj] || 'Não consultado',
      'Faturamento como Cliente (R$)': Number((p.faturamentoCliente || 0).toFixed(2)),
      'Compras como Fornecedor (R$)': Number((p.faturamentoFornecedor || 0).toFixed(2)),
    }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(linhas.length ? linhas : [{ 'Info': 'Nenhum cliente/fornecedor encontrado' }]);
  ws['!cols'] = [{ wch: 20 }, { wch: 40 }, { wch: 6 }, { wch: 22 }, { wch: 20 }, { wch: 24 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Regimes');
  XLSX.writeFile(wb, `regimes-clientes-fornecedores-${new Date().toISOString().slice(0, 10)}.xlsx`);
};

const exportarRelatorioFiscal = async () => {
  const XLSX = await import('xlsx');
  const creditosParaExport = creditosManuais.length > 0
    ? creditosManuais
    : (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch (_) { return []; } })();

  const wb = XLSX.utils.book_new();

  const fBRL = v => Number((v||0).toFixed(2));
  const fPct = v => Math.round((v||0) * 10000) / 100; // evita floating point
  const periodo = selectedCompetence === 'TODAS' ? 'Todo o Período' : selectedCompetence;
  const empresa = currentUser.razaoSocial || currentUser.name || 'N/I';
  const cnpj = currentUser.licenseCNPJ || 'N/I';
  const rules = REFORM_SCHEDULE[reformYear] || { cbs: 0, ibs: 0 };

  // Resolve a redução via discriminador (mesma lógica do ApuracaoTab/ReductionInsightsTab)
  // e usa o resultado tanto para o cálculo de CBS/IBS quanto para o rótulo da
  // categoria — evita que o Excel mostre um item em "Alíquota Zero" com débito
  // calculado pela alíquota cheia (ou vice-versa).
  const resolverItem = (item, isEntrada) => {
    const xProd = item.prodNome || '';
    const ncm = (item.prodNCM || '').replace(/\D/g, '').padStart(8, '0');
    const cached = getCachedNcmDecisao(cnpj, ncm, xProd, null);
    const cachedNbs = getCachedNbsDecisao(cnpj, (item.prodNBS || '').replace(/\D/g, ''));
    const { reduction, disc } = resolveReducaoEfetiva(item.prodNCM, xProd, item.prodNBS, cached, null, cachedNbs, ncmConfirmacoes);

    const regime = isEntrada ? (item.impostoDestacado?.temDados ? 'normal' : 'simples') : 'normal';
    const orig = isEntrada ? (item.peerUF||'RJ') : (item.emitUF||'RJ');
    const dest = isEntrada ? (item.emitUF||'RJ') : (item.peerUF||'RJ');
    // saídas: null (igual ao ApuracaoTab) | entradas: imposto real
    const imposto = isEntrada ? (item.impostoDestacado||null) : null;
    const imp = calculateReformImpact(item.prodValTotal, reformYear, orig, dest, regime, 0, 'Regime Normal', item.prodNCM, item.prodNBS||'', imposto, isEntrada, item.prodCFOP||'', xProd, reduction);

    return {
      imp,
      red: reduction?.reducao || 0,
      statusNCM: disc.status,
      substancia: disc.substancia || '',
      fundamentacao: disc.fundamentacao || '',
      formaConfirmacao: disc.formaConfirmacao || '',
    };
  };
  const iS = saidasFiltradas.map(i  => ({ ...i, ...resolverItem(i, false) }));
  const iE = entradasFiltradas.map(i => ({ ...i, ...resolverItem(i, true) }));

  const debCbs = iS.reduce((a,i)=>a+(i.imp.taxes.cbs||0),0);
  const debIbs = iS.reduce((a,i)=>a+(i.imp.taxes.ibs||0),0);
  const creCbs = iE.reduce((a,i)=>a+(i.imp.taxes.cbs||0),0);
  const creIbs = iE.reduce((a,i)=>a+(i.imp.taxes.ibs||0),0);

  const REDS = { mercadorias:1,insumos:1,frete_pj:1,energia:1,telecom:1,servicos_gerais:1,
    ativo_imobilizado:1,software:1,vale_refeicao:1,servicos_liberal:0.7,
    plano_saude:0.4,educacao_func:0.4,alugueis:0.3,frete_autonomo:0,compra_usados_pf:0 };

const crManCbs = creditosParaExport.reduce((a,c)=>a+c.valor*(rules.cbs/100)*(REDS[c.categoria]??1),0);
const crManIbs = creditosParaExport.reduce((a,c)=>a+c.valor*(rules.ibs/100)*(REDS[c.categoria]??1),0);
const totalDeb = debCbs + debIbs;
const totalCre = creCbs + creIbs + crManCbs + crManIbs;
const saldo    = totalDeb - totalCre;

  const catS = (perc) => iS.filter(i=>i.red===perc);
  const catE = (perc) => iE.filter(i=>i.red===perc);
  const somaVal = (arr) => arr.reduce((a,i)=>a+(i.prodValTotal||0),0);
  const somaCbs = (arr) => arr.reduce((a,i)=>a+(i.imp.taxes.cbs||0),0);
  const somaIbs = (arr) => arr.reduce((a,i)=>a+(i.imp.taxes.ibs||0),0);

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // ABA 1 — APURAÇÃƒO IBS/CBS
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // Usamos array de arrays para controle total do layout
  const a1 = [
    [`APURAÇÃƒO IBS/CBS — ${empresa}`,'','','','',''],
    [`CNPJ: ${cnpj}`,`Período: ${periodo}`,`Ano: ${reformYear}`,`CBS: ${rules.cbs}% | IBS: ${rules.ibs}%`,'',''],
    ['','','','','',''],

    // â"€â"€ Débitos â"€â"€
    ['DÉBITOS (SAÍDAS)','Itens','Valor Base (R$)','CBS (R$)','IBS (R$)','Total IBS+CBS (R$)'],
    ...[ [0,'Alíquota Cheia (sem redução)'],[60,'Redução 60% — LC 214/2025'],[100,'Alíquota Zero / Isenção 100%'] ]
      .filter(([p])=> catS(p).length > 0)
      .map(([p,label])=>{
        const arr=catS(p);
        const cbs=somaCbs(arr), ibs=somaIbs(arr);
        return [label, arr.length, fBRL(somaVal(arr)), fBRL(cbs), fBRL(ibs), fBRL(cbs+ibs)];
      }),
    ['TOTAL DÉBITOS', iS.length, fBRL(somaVal(iS)), fBRL(debCbs), fBRL(debIbs), fBRL(totalDeb)],
    ['','','','','',''],

    // â"€â"€ Créditos XML â"€â"€
    ['CRÉDITOS (ENTRADAS XML)','Itens','Valor Base (R$)','CBS (R$)','IBS (R$)','Total IBS+CBS (R$)'],
    ...[ [0,'Alíquota Cheia'],[60,'Redução 60%'],[100,'Alíquota Zero'] ]
      .filter(([p])=> catE(p).length > 0)
      .map(([p,label])=>{
        const arr=catE(p);
        const cbs=somaCbs(arr), ibs=somaIbs(arr);
        return [label, arr.length, fBRL(somaVal(arr)), fBRL(cbs), fBRL(ibs), fBRL(cbs+ibs)];
      }),
    ['TOTAL CRÉDITOS XML', iE.length, fBRL(somaVal(iE)), fBRL(creCbs), fBRL(creIbs), fBRL(creCbs+creIbs)],
    ['','','','','',''],
  ];

  // â"€â"€ Créditos manuais â"€â"€
 if (creditosParaExport.length > 0) {
    a1.push(['CRÉDITOS MANUAIS (CONTAS COM REDUÇÃƒO)','Categoria / Obs','Valor Base (R$)','CBS (R$)','IBS (R$)','Total Crédito (R$)']);
    creditosParaExport.forEach(c => {
      const fator = REDS[c.categoria] ?? 1;
      const cbs = c.valor*(rules.cbs/100)*fator;
      const ibs = c.valor*(rules.ibs/100)*fator;
      const pctCredito = Math.round(fator*100);
      const obs = fator < 1 ? `Crédito ${pctCredito}% (redução ${100-pctCredito}% — LC 214/2025)` : 'Crédito integral';
      a1.push([c.descricao, obs, fBRL(c.valor), fBRL(cbs), fBRL(ibs), fBRL(cbs+ibs)]);
    });
a1.push(['TOTAL MANUAIS','', fBRL(creditosParaExport.reduce((a,c)=>a+c.valor,0)), fBRL(crManCbs), fBRL(crManIbs), fBRL(crManCbs+crManIbs)]);
    a1.push(['','','','','','']);
  }

  // â"€â"€ Saldo â"€â"€
  a1.push(['TOTAL CRÉDITOS (XML + MANUAIS)','','', fBRL(creCbs+crManCbs), fBRL(creIbs+crManIbs), fBRL(totalCre)]);
  a1.push(['','','','','','']);
  a1.push([saldo > 0 ? '▶  SALDO A PAGAR' : '▶  SALDO A RECUPERAR','','', fBRL(Math.abs(debCbs-creCbs-crManCbs)), fBRL(Math.abs(debIbs-creIbs-crManIbs)), fBRL(Math.abs(saldo))]);

  const ws1 = XLSX.utils.aoa_to_sheet(a1);
  ws1['!cols'] = [{wch:42},{wch:36},{wch:18},{wch:14},{wch:14},{wch:18}];
  XLSX.utils.book_append_sheet(wb, ws1, '01 - Apuração IBS-CBS');

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // ABA 2 — SIMPLES NACIONAL
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const parseVal = s => parseFloat((s||'0').replace(/[^\d,]/g,'').replace(',','.')) || 0;
  const rbt12   = parseVal(simplesRbt12Raw);
  const anoTab  = SIMPLES_DB[reformYear] ? reformYear : Object.keys(SIMPLES_DB).sort().reverse().find(a=>a<=reformYear)||'2027';

  const a2 = [
    [`SIMPLES NACIONAL — ${empresa}`,'','',''],
    [`CNPJ: ${cnpj}`,`Período: ${periodo}`,`Ano: ${reformYear}`,`RBT12: R$ ${rbt12.toLocaleString('pt-BR',{minimumFractionDigits:2})}`],
    ['','','',''],
    ['','POR DENTRO (IBS/CBS no DAS)','POR FORA (IBS/CBS separados)',''],
  ];

  let totDentro=0, totFora=0, totFat=0;

  simplesSegmentos.forEach((seg,si) => {
    const tab = SIMPLES_DB[anoTab]?.[seg.anexo];
    if (!tab) return;
    const fat = parseVal(seg.fatRaw);
    if (!fat||!rbt12) return;
    const fi = tab.faixas.findIndex(f=>rbt12<=f.limite);
    const faixaIdx = fi>=0?fi:tab.faixas.length-1;
    const faixa = tab.faixas[faixaIdx];
    const aliqEf = (rbt12*faixa.nominal-faixa.deducao)/rbt12;
    const icmsIdx = tab.tributos.indexOf('ICMS');
    const issIdxExport = tab.tributos.indexOf('ISS');
    const dasBruto = fat*aliqEf;

    const hasST = seg.showST && (parseVal(seg.secaoIRaw)>0||parseVal(seg.secaoIIRaw)>0);
    const r1 = hasST?parseVal(seg.secaoIRaw):fat;
    const r2 = hasST?parseVal(seg.secaoIIRaw):0;
    const icmsRep = faixa.rep[icmsIdx] || 0;
    const dasDentroBruto = dasBruto - r2 * aliqEf * icmsRep;
    const calcFora=(receita,noICMS)=>{
      if(!receita)return 0;
      return tab.tributos.reduce((a,nome,i)=>{
        if(nome==='IBS'||nome==='CBS')return a;
        if(noICMS&&i===icmsIdx)return a;
        return a+receita*aliqEf*(faixa.rep[i]||0);
      },0);
    };
    const dasForaBruto = calcFora(r1,false)+calcFora(r2,true);

    // ISS retido na fonte pelo tomador — abate do DAS (mesma regra do SimplesNacionalTab)
    const issRetRevenue = Math.min(parseVal(seg.issRetRaw), fat);
    const issRetDeduzido = (issIdxExport >= 0 && issRetRevenue > 0)
      ? issRetRevenue * aliqEf * (faixa.rep[issIdxExport] || 0)
      : 0;
    const dasDentro = Math.max(0, dasDentroBruto - issRetDeduzido);
    const dasFora = Math.max(0, dasForaBruto - issRetDeduzido);
    totDentro+=dasDentro; totFora+=dasFora; totFat+=fat;

    a2.push(['','','','']);
    a2.push([`Segmento ${si+1}: ${tab.nome}`,'','','']);
    a2.push(['Faturamento do Segmento', `R$ ${fat.toLocaleString('pt-BR',{minimumFractionDigits:2})}`,'','']);
    if(hasST){
      a2.push([`  Seção I — Sem ST (ICMS no DAS)`,`R$ ${r1.toLocaleString('pt-BR',{minimumFractionDigits:2})}`,'','']);
      a2.push([`  Seção II — ST ICMS (ICMS = R$ 0,00)`,`R$ ${r2.toLocaleString('pt-BR',{minimumFractionDigits:2})}`,'','']);
    }
    a2.push([`Faixa`, `${faixaIdx+1}ª`,'','']);
    a2.push([`Alíquota Nominal`, `${fPct(faixa.nominal)}%`,'','']);
    a2.push([`Alíquota Efetiva`, `${(aliqEf*100).toFixed(4)}%`,'','']);
    a2.push(['','','','']);
// Calcula por seção respeitando ST (igual ao SimplesNacionalTab)
const dasBrutoR1 = r1 * aliqEf;
const dasBrutoR2 = r2 * aliqEf;
a2.push(['Repartição do DAS','Por Dentro (R$)','Por Fora (R$)','Obs']);
tab.tributos.forEach((nome,i)=>{
  const rep = faixa.rep[i]||0;
  const excluido = nome==='IBS'||nome==='CBS';
  const isICMS = i === icmsIdx;
  // ICMS só incide na Seção I; outros tributos incidem em ambas as seções
  const valDentro = isICMS
    ? dasBrutoR1 * rep
    : (dasBrutoR1 + dasBrutoR2) * rep;
  const valFora = (excluido || (isICMS && false)) ? (excluido ? 0 : valDentro) : valDentro;
  // Por fora: exclui IBS e CBS, mantém o resto (incluindo ICMS na Seção I)
  const valForaReal = excluido ? 0 : (isICMS ? dasBrutoR1 * rep : (dasBrutoR1 + dasBrutoR2) * rep);
  a2.push([`${nome} (${fPct(rep)}%)`, fBRL(valDentro), fBRL(valForaReal), excluido?'Excluído no Por Fora':'']);
});
if (issRetDeduzido > 0) {
  a2.push(['ISS Retido na Fonte (Dedução)', `- ${fBRL(issRetDeduzido)}`, `- ${fBRL(issRetDeduzido)}`, 'tpRetISSQN=2 nos XMLs']);
}
a2.push(['DAS do Segmento', fBRL(dasDentro), fBRL(dasFora),'']);
  });

  // Totais e comparativo
  a2.push(['','','','']);
  a2.push(['â•â•â• TOTAL A RECOLHER â•â•â•','Por Dentro (R$)','Por Fora (R$)','']);
  a2.push(['DAS Total', fBRL(totDentro), fBRL(totFora),'']);
  a2.push(['IBS+CBS (apuração separada)', '(incluso no DAS)', fBRL(Math.max(saldo,0)),'']);
  a2.push(['TOTAL', fBRL(totDentro), fBRL(totFora+Math.max(saldo,0)),'']);
  a2.push(['','','','']);
  a2.push(['Detalhamento IBS/CBS (Por Fora)','','','']);
  a2.push(['  Débito CBS+IBS (saídas)', fBRL(totalDeb),'','']);
  a2.push(['  Crédito CBS+IBS (entradas + manuais)', fBRL(totalCre),'','']);
  a2.push([saldo>0?'  Saldo a Pagar':'  Saldo a Recuperar', fBRL(Math.abs(saldo)),'','']);

  const ws2 = XLSX.utils.aoa_to_sheet(a2);
  ws2['!cols'] = [{wch:42},{wch:22},{wch:22},{wch:36}];
  XLSX.utils.book_append_sheet(wb, ws2, '02 - Simples Nacional');

  // ══ ABA 3 — DETALHAMENTO NCM (papel de trabalho de auditoria) ══
  const statusLabel = {
    ENQUADRADO:   'ENQUADRADO',
    CONFERIR:     'CONFERIR (sem benefício automático)',
    FORA_DO_ANEXO: 'FORA DO ANEXO',
  };
  const formaLabel = {
    ncm_direta:            'NCM direta',
    automatica_substancia: 'Automática (match literal)',
    manual:                'Manual (decisão humana)',
  };
  const allItems = [
    ...iS.map(i => ({ ...i, _fluxo: 'Saída' })),
    ...iE.map(i => ({ ...i, _fluxo: 'Entrada' })),
  ];
  const ws3rows = allItems.map(i => ({
    'Fluxo': i._fluxo,
    'Data': i.date || '',
    'NF / Chave': i.chaveAcesso || i.nNF || '',
    'NCM': i.prodNCM || '',
    'Produto': i.prodNome || '',
    'Status Enquadramento': statusLabel[i.statusNCM] || i.statusNCM || '',
    'Substância Identificada': i.substancia || '',
    'Fundamentação Legal': i.fundamentacao || '',
    'Forma de Confirmação': formaLabel[i.formaConfirmacao] || i.formaConfirmacao || '',
    'Redução (%)': i.red || 0,
    'Valor Base (R$)': fBRL(i.prodValTotal),
    'CBS (R$)': fBRL(i.imp?.taxes?.cbs || 0),
    'IBS (R$)': fBRL(i.imp?.taxes?.ibs || 0),
  }));
  const ws3conferir = allItems.filter(i => i.statusNCM === 'CONFERIR').map(i => ({
    'Fluxo': i._fluxo,
    'Data': i.date || '',
    'NCM': i.prodNCM || '',
    'Produto': i.prodNome || '',
    'Status': 'CONFERIR',
    'Valor Base (R$)': fBRL(i.prodValTotal),
    'Obs': 'NCM com 2+ substâncias possíveis — revisar manualmente na aba Conferência NCM',
  }));
  const ws3 = XLSX.utils.json_to_sheet(ws3rows.length ? ws3rows : [{ Info: 'Nenhum item encontrado' }]);
  ws3['!cols'] = [{wch:8},{wch:12},{wch:20},{wch:12},{wch:40},{wch:20},{wch:28},{wch:50},{wch:24},{wch:12},{wch:16},{wch:12},{wch:12}];
  XLSX.utils.book_append_sheet(wb, ws3, '03 - Itens NCM');

  if (ws3conferir.length > 0) {
    const ws4 = XLSX.utils.json_to_sheet(ws3conferir);
    ws4['!cols'] = [{wch:8},{wch:12},{wch:12},{wch:40},{wch:10},{wch:16},{wch:60}];
    XLSX.utils.book_append_sheet(wb, ws4, '04 - CONFERIR NCM');
  }

  XLSX.writeFile(wb, `apuracao-${cnpj.replace(/\D/g,'')}-${periodo.replace(/\//g,'-')}-${reformYear}.xlsx`);
};
  const opAccentColor = operacoesFlow === 'saidas' ? ACCENT : '#10b981';
  const opMapColor   = operacoesFlow === 'saidas' ? ACCENT : '#10b981';
  const opLineColor  = operacoesFlow === 'saidas' ? ACCENT : '#10b981';
  const opData       = operacoesFlow === 'saidas' ? saidasData : entradasData;
  const opIsSaida    = operacoesFlow === 'saidas';
  const refData      = reformaFlow === 'saidas' ? saidasFaturamento : entradasFaturamento;
  const refLabel     = reformaFlow === 'saidas' ? 'Saídas' : 'Entradas';
  const refIsEntrada = reformaFlow === 'entradas';

  const OPERACOES_TABS = [
    { id: 'dashboard', label: 'Dashboard BI', icon: MapIcon },
    { id: 'produtos', label: opIsSaida ? 'Produtos' : 'Compras', icon: opIsSaida ? Package : ShoppingCart },
  ];
  return (
    <div className="min-h-screen bg-gray-100 font-sans text-slate-800 pb-12">
      <div className="bg-[#222222] sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          {/* Logo RN */}
          <div className="flex items-center gap-4">
            <img src={logoRN} alt="RN Contabilidade" className="h-11 w-auto rounded"/>
            <div className="w-px h-6 bg-white/20 hidden md:block"/>
            <div className="hidden md:block">
              <span className="text-white text-sm font-bold tracking-tight">
                {periodoData?.cliente?.razao_social || currentUser.name}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/>
                <span className="text-gray-500 text-[10px]">Sistema Tributário · {currentUser.licenseCNPJ}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportarRelatorioFiscal}
              disabled={saidasFiltradas.length === 0 && entradasFiltradas.length === 0}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:opacity-50 text-white font-bold text-xs px-3 py-2 rounded-lg transition-colors">
              <FileText className="w-4 h-4"/>
              <span className="hidden md:inline">Exportar</span>
            </button>
            <button
              onClick={exportarRelatorioRegimes}
              disabled={saidasData.length === 0 && entradasData.length === 0}
              title="Exportar regimes tributários de clientes e fornecedores"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white font-bold text-xs px-3 py-2 rounded-lg transition-colors">
              <Users className="w-4 h-4"/>
              <span className="hidden md:inline">Regimes</span>
            </button>
            <button
              onClick={() => { setShowImportModal(true); setImportResult(null); setImportProgress(0); }}
              className="flex items-center gap-2 bg-[#D9C14A] hover:bg-[#B8A030] text-white font-bold text-xs px-3 py-2 rounded-lg transition-colors">
              <Upload className="w-4 h-4"/>
              <span className="hidden md:inline">Importar XMLs</span>
            </button>
            <button onClick={() => { setCurrentUser(null); setSaidasData([]); setEntradasData([]); setAnalysisData(null); setLoginForm({username:'',password:''}); try { localStorage.removeItem('rn_auth_session_v1'); } catch (_) {} }}
              className="flex items-center gap-2 text-gray-400 hover:text-red-400 font-bold text-xs px-3 py-2 hover:bg-white/5 rounded-lg transition-colors">
              <LogOut className="w-4 h-4"/>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6 flex flex-col md:flex-row gap-5 items-start">
        {/* ── módulos na lateral (substitui as antigas abas horizontais) ── */}
        <aside className="w-full md:w-56 md:shrink-0 md:sticky md:top-[92px]">
          <nav className="flex flex-row md:flex-col gap-0.5 bg-white border border-slate-200 rounded-xl p-1.5 overflow-x-auto shadow-sm">
            {[
              { id: 'fiscal', label: 'Fiscal', icon: Activity },
              { id: 'reforma', label: 'Reforma Tributária', icon: FileText },
              { id: 'contabil', label: 'Contábil', icon: Calculator },
              { id: 'dp', label: 'DP', icon: Users },
              { id: 'financeiro', label: 'Financeiro', icon: Tag },
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveModule(id)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                  activeModule === id ? 'bg-[#222222] text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
                }`}>
                <Icon className={`w-4 h-4 shrink-0 ${activeModule === id ? 'text-[#D9C14A]' : 'text-slate-400'}`}/> {label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1 min-w-0 space-y-4">

        {uploadError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0"/>
            <div><h3 className="font-bold text-red-800">Aviso</h3><p className="text-sm text-red-700">{uploadError}</p></div>
          </div>
        )}

        {/* MÃ"DULO: PRICING */}
        {activeModule === 'pricing' && (
          <div>
            <div className="flex gap-1 overflow-x-auto pb-2 mb-4">
              {['upload','analysis','batch'].map(tab => {
                const labels = { upload:'Importar XML', analysis:'Simulador Unitário', batch:'Processamento em Lote' };
                const icons = { upload: Upload, analysis: TrendingUp, batch: Layers };
                const Icon = icons[tab];
                return (
                  <button key={tab} onClick={() => setPricingTab(tab)} disabled={tab==='analysis' && !analysisData}
                    className={`px-5 py-3 text-sm font-bold flex items-center gap-2 rounded-t-lg transition-all whitespace-nowrap ${pricingTab===tab ? 'bg-white border-t-4 border-[#D9C14A] text-slate-800 shadow-sm' : 'bg-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30'}`}>
                    <Icon className={`w-4 h-4 ${pricingTab===tab ? 'text-[#D9C14A]' : ''}`}/> {labels[tab]}
                  </button>
                );
              })}
            </div>

            {pricingTab === 'upload' && (
              <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm border border-slate-200 p-12 text-center">
                <div className="max-w-lg mx-auto space-y-6">
                  <div className="w-20 h-20 bg-[#222222] rounded-2xl flex items-center justify-center mx-auto shadow-xl transform rotate-3"><Upload className="w-8 h-8 text-white"/></div>
                  <h2 className="text-3xl font-bold text-[#222222]">Importação Fiscal</h2>
                  <p className="text-slate-500 leading-relaxed">XML único para o simulador de precificação. Para análise em volume, use Processamento em Lote.</p>
                  <label className="block transform hover:scale-105 active:scale-95 cursor-pointer">
                    <span className="block w-full py-4 px-8 rounded-xl font-bold text-white shadow-xl bg-[#D9C14A] hover:bg-[#B8A030] flex items-center justify-center gap-3"><FolderOpen className="w-5 h-5"/> Selecionar XML</span>
                    <input type="file" accept=".xml" onChange={handleFileUpload} className="hidden"/>
                  </label>
                  <button onClick={loadMockData} className="text-slate-400 hover:text-slate-600 text-xs font-bold underline">Carregar dados de demonstração</button>
                </div>
              </div>
            )}

            {pricingTab === 'analysis' && analysisData && (
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 sticky top-24 z-40 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Alíquota Simples Nacional</label>
                    <div className="flex items-center gap-2"><input type="number" value={simplesRate} onChange={e => setSimplesRate(Number(e.target.value))} className="w-full text-xl font-bold text-[#D9C14A] bg-transparent border-none outline-none focus:ring-0" step="0.01"/><span className="text-slate-400 font-bold">%</span></div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Estado de Destino</label>
                    <select value={selectedUF} onChange={e => setSelectedUF(e.target.value)} className="w-full bg-transparent font-bold text-lg text-[#222222] border-none outline-none focus:ring-0 cursor-pointer">
                      {UF_LIST.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                  </div>
                  <div className="px-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 flex justify-between"><span>Margem de Lucro</span><span>{globalMargin}%</span></label>
                    <input type="range" min="0" max="50" value={globalMargin} onChange={e => setGlobalMargin(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#D9C14A]"/>
                  </div>
                </div>
                <div className="grid gap-4">
                  {analysisData.products.map((product, idx) => {
                    const simples = calculateRegimeScenario(product.currentPrice,'simples-nacional',globalMargin,selectedUF,product.emitUF||'RJ',product.isNFCE,simplesRate);
                    const presumido = calculateRegimeScenario(product.currentPrice,'lucro-presumido',globalMargin,selectedUF,product.emitUF||'RJ',product.isNFCE,simplesRate);
                    const real = calculateRegimeScenario(product.currentPrice,'lucro-real',globalMargin,selectedUF,product.emitUF||'RJ',product.isNFCE,simplesRate);
                    const isExp = expandedItem === idx;
                    return (
                      <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors">
                        <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer" onClick={() => setExpandedItem(isExp ? null : idx)}>
                          <div className="flex-1">
                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">{product.description}{product.isNFCE && <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Receipt className="w-3 h-3"/> Varejo</span>}</h3>
                            <div className="flex flex-wrap gap-2 text-xs text-slate-500 mt-2">
                              <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded font-mono text-slate-600">NCM: {product.ncm}</span>
                              {product.cfop && <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-1 rounded font-bold">CFOP: {product.cfop}</span>}
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-6">
                            <div><p className="text-[10px] text-slate-400 uppercase font-bold">Preço Unit.</p><p className="text-xl font-extrabold text-[#222222]">R$ {product.currentPrice.toFixed(2)}</p></div>
                            <div className={`p-2 rounded-full hover:bg-slate-100 ${isExp ? 'rotate-180' : ''} transition-transform`}><ChevronDown className="w-5 h-5 text-slate-400"/></div>
                          </div>
                        </div>
                        {isExp && (
                          <div className="grid md:grid-cols-3 bg-slate-50 border-t border-slate-200">
                            <div className="p-6 border-b md:border-b-0 md:border-r border-slate-200 relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-1 h-full bg-[#D9C14A]"></div>
                              <div className="mb-4"><span className="text-xs font-bold uppercase text-slate-500">Simples Nacional</span></div>
                              <div className="flex justify-between items-end mb-2"><span className="text-slate-600 text-sm">Custo Base</span><span className="font-bold text-slate-800">R$ {simples.baseCost.toFixed(2)}</span></div>
                              <div className="flex justify-between items-end"><span className="text-slate-600 text-sm">Impostos ({simplesRate}%)</span><span className="font-bold text-slate-800">R$ {(product.currentPrice * simplesRate/100).toFixed(2)}</span></div>
                            </div>
                            <div className="p-6 border-b md:border-b-0 md:border-r border-slate-200 bg-white">
                              <div className="mb-4 flex justify-between items-center"><span className="text-xs font-bold uppercase text-blue-600">Lucro Presumido</span>{presumido.variation < 0 && <span className="text-[10px] bg-green-100 text-green-700 px-2 rounded-full font-bold">Mais barato</span>}</div>
                              <p className="text-xs text-slate-500">Preço Sugerido</p>
                              <div className="flex items-baseline gap-2 mb-2"><span className="text-2xl font-bold text-slate-800">R$ {presumido.newPrice.toFixed(2)}</span><span className={`text-xs font-bold ${presumido.variation > 0 ? 'text-red-500' : 'text-green-500'}`}>{presumido.variation > 0 ? '+' : ''}{presumido.variation.toFixed(1)}%</span></div>
                              <div className="text-xs text-slate-400 mb-2">Carga: {presumido.totalTaxRate.toFixed(2)}%</div>
                              <div className="mt-3 pt-2 border-t border-slate-100 space-y-1">{Object.entries(presumido.taxes).map(([k,v]) => <div key={k} className="flex justify-between text-[10px] text-slate-500"><span>{k}</span><span className="font-bold">{v.toFixed(2)}%</span></div>)}</div>
                            </div>
                            <div className="p-6 bg-white">
                              <div className="mb-4"><span className="text-xs font-bold uppercase text-emerald-600">Lucro Real</span></div>
                              <p className="text-xs text-slate-500">Preço Sugerido</p>
                              <div className="flex items-baseline gap-2 mb-2"><span className="text-2xl font-bold text-slate-800">R$ {real.newPrice.toFixed(2)}</span><span className={`text-xs font-bold ${real.variation > 0 ? 'text-red-500' : 'text-green-500'}`}>{real.variation > 0 ? '+' : ''}{real.variation.toFixed(1)}%</span></div>
                              <div className="text-xs text-slate-400 mb-2">Carga: {real.totalTaxRate.toFixed(2)}%</div>
                              <div className="mt-3 pt-2 border-t border-slate-100 space-y-1">{Object.entries(real.taxes).map(([k,v]) => <div key={k} className="flex justify-between text-[10px] text-slate-500"><span>{k}</span><span className="font-bold">{v.toFixed(2)}%</span></div>)}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {pricingTab === 'batch' && (
              <div className="space-y-6">
                <div className="bg-white p-10 rounded-xl shadow-sm border border-slate-200 text-center">
                  <div className="w-16 h-16 bg-[#222222] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"><Layers className="w-8 h-8 text-white"/></div>
                  <h2 className="text-2xl font-bold text-[#222222] mb-3">Processamento em Lote (Big Data)</h2>
                  <p className="text-slate-500 mb-6 max-w-lg mx-auto">Importe múltiplos XMLs. O sistema separa automaticamente <strong>Saídas</strong> (você emitiu) de <strong>Entradas</strong> (você recebeu).</p>
                  <div className="flex flex-col md:flex-row justify-center items-center gap-6 mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200 max-w-3xl mx-auto">
                    <button onClick={carregarDemoCompleta} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-md flex items-center gap-2 transform hover:scale-105 transition-all">
                      <RefreshCw className="w-5 h-5"/> Gerar Base de Demonstração
                    </button>
                    <div className="hidden md:block w-px h-10 bg-slate-300"></div>
                    <label className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
                      <div className="relative">
                        <input type="checkbox" className="sr-only" checked={modoApresentacao} onChange={() => setModoApresentacao(!modoApresentacao)}/>
                        <div className={`block w-12 h-7 rounded-full transition-colors ${modoApresentacao ? 'bg-[#D9C14A]' : 'bg-slate-300'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${modoApresentacao ? 'transform translate-x-5' : ''}`}></div>
                      </div>
                      <div className="ml-3 text-sm font-bold text-slate-700 flex items-center gap-2">
                        <ShieldAlert className={`w-4 h-4 ${modoApresentacao ? 'text-[#D9C14A]' : 'text-slate-400'}`}/>
                        Ocultar Dados Reais (Modo Demo)
                      </div>
                    </label>
                  </div>
                  <div className="flex gap-4 justify-center mb-6 text-sm mt-8 border-t border-slate-100 pt-8">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 flex items-center gap-2"><ArrowUpRight className="w-4 h-4 text-[#D9C14A]"/><span className="font-bold text-slate-700">{saidasData.length} Saídas</span></div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 flex items-center gap-2"><Truck className="w-4 h-4 text-emerald-600"/><span className="font-bold text-emerald-800">{entradasData.length} Entradas</span></div>
                  </div>
                  <p className="text-xs text-slate-400 mb-4 font-bold uppercase tracking-wider">Ou importe arquivos reais do cliente:</p>
                  <label className="inline-block transform hover:scale-105 active:scale-95">
                    <span className="bg-[#222222] hover:bg-[#0d0d0d] text-white px-8 py-4 rounded-xl cursor-pointer font-bold shadow-lg flex items-center gap-3"><Upload className="w-5 h-5"/> Selecionar Múltiplos Arquivos (.xml)</span>
                    <input type="file" multiple accept=".xml" onChange={handleBatchUpload} className="hidden"/>
                  </label>
                  {isBatchProcessing && (<div className="mt-8 flex flex-col items-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-[#D9C14A] rounded-full animate-spin"></div><p className="mt-2 text-slate-500 font-bold text-sm">Processando e classificando notas...</p></div>)}
                </div>
                {(saidasData.length > 0 || entradasData.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl border-2 border-slate-200 shadow-sm p-5">
                      <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-1"><ArrowUpRight className="w-5 h-5 text-[#D9C14A]"/> Notas de Saída</h3>
                      <p className="text-2xl font-bold text-slate-800">{saidasData.length} <span className="text-sm font-normal text-slate-400">itens</span></p>
                      <button onClick={() => { setActiveModule('operacoes'); setOperacoesFlow('saidas'); setOperacoesTab('lista'); }} className="mt-4 bg-[#D9C14A] hover:bg-[#B8A030] text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors">Ver Operações de Saída →</button>
                    </div>
                    <div className="bg-white rounded-xl border-2 border-emerald-200 shadow-sm p-5">
                      <h3 className="font-bold text-emerald-800 flex items-center gap-2 mb-1"><Truck className="w-5 h-5 text-emerald-600"/> Notas de Entrada</h3>
                      <p className="text-2xl font-bold text-slate-800">{entradasData.length} <span className="text-sm font-normal text-slate-400">itens</span></p>
                      <button onClick={() => { setActiveModule('operacoes'); setOperacoesFlow('entradas'); setOperacoesTab('lista'); }} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors">Ver Operações de Entrada →</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}


{/* MÓDULO: FISCAL (dados extraídos do XML: saídas, entradas, mapa, produtos, fornecedores) */}
        {activeModule === 'fiscal' && (
          <VisaoGeralTab
            saidasData={saidasData}
            entradasData={entradasData}
            cnpjCache={cnpjCache}
          />
        )}

{/* MÓDULO: REFORMA TRIBUTÁRIA (Impacto da Reforma / Confronto IBS-CBS / Simples Nacional, aninhados) */}
        {activeModule === 'reforma' && (
          <div className="space-y-4">
            <div className="flex gap-1 overflow-x-auto pb-1">
              {[
                { id: 'impacto', label: 'Impacto da Reforma' },
                { id: 'apuracao', label: 'Confronto IBS/CBS' },
                { id: 'simples', label: 'Simples Nacional' },
              ].map(({ id, label }) => (
                <button key={id} onClick={() => setReformaSubTab(id)}
                  className={`px-4 py-2 text-sm font-bold rounded-lg whitespace-nowrap transition-colors ${reformaSubTab === id ? 'bg-[#222222] text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                  {label}
                </button>
              ))}
            </div>

        {reformaSubTab === 'impacto' && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1 flex gap-1">
                <button onClick={() => setReformaFlow('saidas')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${reformaFlow==='saidas' ? 'bg-[#D9C14A] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
                  <ArrowUpRight className="w-4 h-4"/> Saídas
                  {saidasData.length > 0 && <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${reformaFlow==='saidas' ? 'bg-white text-[#D9C14A]' : 'bg-slate-100 text-slate-600'}`}>{saidasData.length}</span>}
                </button>
                <button onClick={() => setReformaFlow('entradas')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${reformaFlow==='entradas' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
                  <Truck className="w-4 h-4"/> Entradas
                  {entradasData.length > 0 && <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${reformaFlow==='entradas' ? 'bg-white text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{entradasData.length}</span>}
                </button>
              </div>
            </div>
         <ReformTab
  data={refData}
  saidasData={saidasFaturamentoFiltradas}
  entradasData={entradasFaturamentoFiltradas}
  selectedCompetence={selectedCompetence}
  setSelectedCompetence={setSelectedCompetence}
  cnpjCache={cnpjCache}
  setCnpjCache={setCnpjCache}
  simplesRate={simplesRate}
  currentUser={currentUser}
  label={refLabel}
  empresaRegime={empresaRegime}
  isEntrada={refIsEntrada}
  reformYear={reformYear}
  setReformYear={setReformYear}
  getCached={getCachedNcmDecisao}
  saveDecision={saveNcmDecisao}
  deleteDecision={deleteNcmDecisao}
  clearAllDecisions={clearAllNcmDecisoes}
  loadingNcmDecisoes={loadingNcmDecisoes}
  getCachedNbs={getCachedNbsDecisao}
  saveDecisionNbs={saveNbsDecisao}
  loadingNbsDecisoes={loadingNbsDecisoes}
  ncmConfirmacoes={ncmConfirmacoes}
  setNcmConfirmacoes={saveNcmConfirmacoes}
  segmentosSimples={simplesSegmentos}
  rbt12RawSimples={simplesRbt12Raw}
/>
          </div>
        )}
        {reformaSubTab === 'apuracao' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h2 className="text-2xl font-bold text-[#222222] flex items-center gap-2"><BarChart3 className="w-6 h-6 text-[#D9C14A]"/> Apuração: Confronto de Débitos e Créditos</h2>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
                <span className="text-xs font-bold text-slate-700 uppercase">Ano de Simulação:</span>
                <select value={reformYear} onChange={e => setReformYear(e.target.value)} className="bg-transparent font-bold text-slate-800 outline-none text-sm cursor-pointer">
                  {Object.keys(REFORM_SCHEDULE).sort().map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
         <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 mb-4">
  <div className="flex items-center gap-3">
    <div className="bg-[#222222] p-2 rounded-lg text-white"><Filter className="w-4 h-4"/></div>
    <span className="text-sm font-bold text-slate-700">{selectedCompetence === 'TODAS' ? 'Todo o Período' : selectedCompetence}</span>
  </div>
  <div className="flex flex-wrap gap-2">
    <button onClick={() => setSelectedCompetence('TODAS')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${selectedCompetence==='TODAS'?'bg-[#222222] text-white border-transparent':'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>TODAS</button>
    {[...new Set([...saidasData,...entradasData].filter(i=>i.date).map(i=>{const d=new Date(i.date);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}))].sort().reverse().map(comp=>(
      <button key={comp} onClick={()=>setSelectedCompetence(comp)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${selectedCompetence===comp?'bg-[#222222] text-white border-transparent':'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{comp}</button>
    ))}
  </div>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-4">
    <div className="p-3 bg-red-100 rounded-xl"><ArrowUpRight className="w-5 h-5 text-red-600"/></div>
    <div>
      <p className="text-[10px] font-bold uppercase text-slate-400">Faturamento (Saídas)</p>
      <p className="text-xl font-black text-slate-800">
        R$ {saidasParaApuracao.reduce((a,i)=>a+(i.prodValTotal||0),0).toLocaleString('pt-BR',{minimumFractionDigits:2})}
      </p>
      <p className="text-[10px] text-slate-400">{saidasParaApuracao.length} itens • {selectedCompetence === 'TODAS' ? 'todo período' : selectedCompetence}</p>
    </div>
  </div>
  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-4">
    <div className="p-3 bg-emerald-100 rounded-xl"><Truck className="w-5 h-5 text-emerald-600"/></div>
    <div>
      <p className="text-[10px] font-bold uppercase text-slate-400">Volume de Compras (Entradas)</p>
      <p className="text-xl font-black text-slate-800">
        R$ {entradasParaCMV.reduce((a,i)=>a+(i.prodValTotal||0),0).toLocaleString('pt-BR',{minimumFractionDigits:2})}
      </p>
      <p className="text-[10px] text-slate-400">{entradasParaCMV.length} itens • {selectedCompetence === 'TODAS' ? 'todo período' : selectedCompetence}</p>
    </div>
  </div>
  <div className="bg-[#222222] border border-[#222222] rounded-xl p-4 flex items-center gap-4">
    <div className="p-3 bg-white/10 rounded-xl"><Scale className="w-5 h-5 text-white"/></div>
    <div>
      <p className="text-[10px] font-bold uppercase text-gray-300">Resultado Bruto Estimado</p>
      <p className="text-xl font-black text-white">
        R$ {(saidasParaApuracao.reduce((a,i)=>a+(i.prodValTotal||0),0) - entradasParaCMV.reduce((a,i)=>a+(i.prodValTotal||0),0)).toLocaleString('pt-BR',{minimumFractionDigits:2})}
      </p>
      <p className="text-[10px] text-gray-400">Saídas - Entradas</p>
    </div>
  </div>
</div>
{/* Sub-abas do Confronto */}
<div className="flex gap-4 border-b border-slate-200 px-2 mb-6">
  {[
    { id: 'apuracao', label: 'Débito / Crédito', icon: BarChart3, activeClass: 'border-[#D9C14A] text-[#222222]' },
    { id: 'creditos', label: 'Créditos Manuais (IBS/CBS)', icon: CheckCircle, activeClass: 'border-gray-500 text-blue-700' },
  ].map(({ id, label, icon: Icon, activeClass }) => (
    <button key={id} onClick={() => setApuracaoSubTab(id)}
      className={`pb-2 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${apuracaoSubTab === id ? activeClass : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
      <Icon className="w-4 h-4"/> {label}
    </button>
  ))}
</div>

{apuracaoSubTab === 'apuracao' ? (
  <ApuracaoTab saidasData={saidasParaApuracao} entradasData={entradasParaCMV} creditosManuais={creditosManuais} reformYear={reformYear} simplesRate={simplesRate} cnpj={currentUser?.licenseCNPJ} getCached={getCachedNcmDecisao} getCachedNbs={getCachedNbsDecisao} ncmConfirmacoes={ncmConfirmacoes}/>
) : (
  <CreditosTab reformYear={reformYear}/>
)}
          </div>
        )}

        {/* MÃ"DULO: SIMPLES NACIONAL */}
    {reformaSubTab === 'simples' && (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
    <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
      <h2 className="text-2xl font-bold text-[#222222] flex items-center gap-2">
        <Percent className="w-6 h-6 text-[#D9C14A]"/> Simples Nacional — Reforma Tributária
      </h2>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
                <span className="text-xs font-bold text-slate-700 uppercase">Ano de Simulação:</span>
                <select value={reformYear} onChange={e => setReformYear(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 outline-none text-sm cursor-pointer">
                  {['2027','2028','2029','2030','2031','2032','2033'].map(y =>
                    <option key={y} value={y}>{y}</option>
                  )}
                </select>
              </div>
            </div>
<div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 mb-4">
  <div className="flex items-center gap-3">
    <div className="bg-[#222222] p-2 rounded-lg text-white"><Filter className="w-4 h-4"/></div>
    <span className="text-sm font-bold text-slate-700">{selectedCompetence === 'TODAS' ? 'Todo o Período' : selectedCompetence}</span>
  </div>
  <div className="flex flex-wrap gap-2">
    <button onClick={() => setSelectedCompetence('TODAS')} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${selectedCompetence==='TODAS'?'bg-[#222222] text-white border-transparent':'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>TODAS</button>
    {[...new Set([...saidasData,...entradasData].filter(i=>i.date).map(i=>{const d=new Date(i.date);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}))].sort().reverse().map(comp=>(
      <button key={comp} onClick={()=>setSelectedCompetence(comp)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${selectedCompetence===comp?'bg-[#222222] text-white border-transparent':'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{comp}</button>
    ))}
  </div>
</div>
<SimplesNacionalTab
  reformYear={reformYear}
  saidasData={saidasFiltradas}
  entradasData={entradasFiltradas}
  creditosManuais={creditosManuais}
  mainTab={simplesMainTab}
  setMainTab={setSimplesMainTab}
  rbt12Raw={simplesRbt12Raw}
  setRbt12Raw={setSimplesRbt12Raw}
  segmentos={simplesSegmentos}
  setSegmentos={setSimplesSegmentos}
  autoDetectSeg={simplesAutoDetectSeg}
  setAutoDetectSeg={setSimplesAutoDetectSeg}
  simplesRate={simplesRate}
  cnpj={currentUser?.licenseCNPJ}
  getCached={getCachedNcmDecisao}
  getCachedNbs={getCachedNbsDecisao}
  ncmConfirmacoes={ncmConfirmacoes}
/>
          </div>
        )}
          </div>
        )}

{/* MÓDULO: CONTÁBIL */}
        {activeModule === 'contabil' && (
          <div className="space-y-4">
            {loadingReportPeriodo ? (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-sm font-bold text-slate-400">Carregando dados contábeis…</div>
            ) : semPeriodoParaCnpj ? (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-sm font-bold text-slate-400">Nenhum período contábil disponível para este CNPJ ainda.</div>
            ) : !periodoData ? (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-sm font-bold text-slate-400">Nenhum dado encontrado para este CNPJ/período.</div>
            ) : (
              <>
                <PeriodoSelector periodos={periodosDisponiveis} periodoSelecionado={periodoAtualId} onChange={setPeriodoSelecionado} />
                <ReportContabil data={periodoData} periodosData={periodosDataContabil} periodoAtualId={periodoAtualId} />
              </>
            )}
          </div>
        )}

{/* MÓDULO: DP */}
        {activeModule === 'dp' && (
          <div className="space-y-4">
            {loadingReportPeriodo ? (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-sm font-bold text-slate-400">Carregando dados de DP…</div>
            ) : semPeriodoParaCnpj ? (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-sm font-bold text-slate-400">Nenhum período de DP disponível para este CNPJ ainda.</div>
            ) : !periodoData ? (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-sm font-bold text-slate-400">Nenhum dado encontrado para este CNPJ/período.</div>
            ) : (
              <>
                <PeriodoSelector periodos={periodosDisponiveis} periodoSelecionado={periodoAtualId} onChange={setPeriodoSelecionado} />
                <ReportDP data={periodoData} />
              </>
            )}
          </div>
        )}

        {/* MÓDULO: FINANCEIRO (Precificação) */}
        {activeModule === 'financeiro' && (
          <PrecificacaoTab
            saidasData={saidasFiltradas}
            empresaRegime={empresaRegime}
            simplesRate={simplesRate}
            reformYear={reformYear}
            cnpj={currentUser?.licenseCNPJ}
            getCached={getCachedNcmDecisao}
            getCachedNbs={getCachedNbsDecisao}
            ncmConfirmacoes={ncmConfirmacoes}
            segmentosSimples={simplesSegmentos}
            rbt12RawSimples={simplesRbt12Raw}
          />
        )}

      {/* â"€â"€â"€ MODAL DE IMPORTAÇÃƒO GLOBAL â"€â"€â"€ */}
      {showImportModal && (
        <div
          className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget && !isImporting) setShowImportModal(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#222222] rounded-xl flex items-center justify-center">
                  <Upload className="w-4 h-4 text-[#94a3b8]"/>
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-base">Importar Arquivos Fiscais</h2>
                  <p className="text-xs text-slate-400">XML (NF-e / NFC-e) · ZIP com múltiplos XMLs</p>
                </div>
              </div>
              {!isImporting && (
                <button onClick={() => setShowImportModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-slate-400"/>
                </button>
              )}
            </div>

            <div className="p-5 space-y-4">
              {!importResult && (
                <>
                  <label className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center gap-3 ${isImporting ? 'border-slate-200 bg-slate-50 cursor-not-allowed' : 'border-slate-200 hover:border-[#D9C14A] hover:bg-slate-50'}`}>
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-slate-400"/>
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 text-sm">{isImporting ? 'Processando...' : 'Arraste ou clique para selecionar'}</p>
                      <p className="text-xs text-slate-400 mt-1">Aceita .xml avulso, múltiplos .xml ou .zip</p>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-center">
                      {['.xml', '.zip', 'múltiplos'].map(t => (
                        <span key={t} className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded border border-slate-200">{t}</span>
                      ))}
                    </div>
                    <input type="file" multiple accept=".xml,.zip" disabled={isImporting} className="hidden"
                      onChange={e => handleGlobalImport(Array.from(e.target.files))}/>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                    <div className="relative flex-shrink-0">
                      <input type="checkbox" className="sr-only"
                        checked={importMode === 'acrescentar'}
                        onChange={() => setImportMode(p => p === 'acrescentar' ? 'substituir' : 'acrescentar')}/>
                      <div className={`w-10 h-6 rounded-full transition-colors ${importMode === 'acrescentar' ? 'bg-emerald-500' : 'bg-slate-300'}`}/>
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${importMode === 'acrescentar' ? 'translate-x-4' : ''}`}/>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">
                        {importMode === 'acrescentar' ? '+ Acrescentar aos dados existentes' : '↺ Substituir dados existentes'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {importMode === 'acrescentar'
                          ? 'Novos XMLs adicionados sem apagar os anteriores'
                          : 'Dados atuais serão substituídos pelos novos arquivos'}
                      </p>
                    </div>
                    <Repeat className={`w-4 h-4 ml-auto flex-shrink-0 ${importMode === 'acrescentar' ? 'text-emerald-500' : 'text-slate-300'}`}/>
                  </label>
                </>
              )}

              {isImporting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500">Processando arquivos...</span>
                    <span className="text-slate-700">{importProgress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#222222] rounded-full transition-all duration-300" style={{ width: `${importProgress}%` }}/>
                  </div>
                </div>
              )}

              {importResult && !isImporting && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
                    <CheckCircle className="w-4 h-4"/>
                    {importResult.total} arquivo(s) processado(s)
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-[#222222]">{importResult.saidas}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Saídas</div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-emerald-700">{importResult.entradas}</div>
                      <div className="text-[10px] font-bold text-emerald-400 uppercase mt-1">Entradas</div>
                    </div>
                    <div className={`border rounded-xl p-3 text-center ${importResult.blocked > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                      <div className={`text-2xl font-bold ${importResult.blocked > 0 ? 'text-amber-600' : 'text-slate-300'}`}>{importResult.blocked}</div>
                      <div className={`text-[10px] font-bold uppercase mt-1 ${importResult.blocked > 0 ? 'text-amber-400' : 'text-slate-300'}`}>Bloqueados</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowImportModal(false); setActiveModule('operacoes'); setOperacoesFlow('saidas'); }}
                      className="flex-1 bg-[#222222] hover:bg-[#0d0d0d] text-white font-bold py-3 rounded-xl text-sm transition-colors"
                    >
                      Ver Operações →
                    </button>
                    <button
                      onClick={() => { setImportResult(null); setImportProgress(0); }}
                      className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl text-sm transition-colors"
                    >
                      Importar mais
                    </button>
                  </div>
                </div>
           )}

                           {!importResult && !isImporting && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex gap-2 items-start">
            <AlertTriangle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-600">
              O sistema separa automaticamente <strong>Saídas</strong> e{" "}
              <strong>Entradas</strong> pelo CNPJ da licença. ZIPs são extraídos
              automaticamente.
            </p>
          </div>
        )}

      </div>
    </div>
  </div>
      )}

        </div>
    </div>
  </div>
);
};

export default TaxAnalyzer;

