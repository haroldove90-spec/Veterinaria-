import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Plus, Activity, Shield, FileText, User, Dog, Calendar, 
  ChevronRight, AlertCircle, Loader2, Image as ImageIcon, Upload, 
  X, Stethoscope, Share2, MessageSquare, Sparkles, Settings, 
  PlayCircle, Rocket, BarChart3, CheckCircle2, Menu, Save, Edit2,
  TrendingUp, DollarSign, Users, HeartPulse
} from 'lucide-react';
import { 
  analyzeClinicalCase, analyzeDiagnosticImage, classifyTriage, 
  generateSocialContent, auditClinicalRecord 
} from './lib/gemini';
import { cn } from './lib/utils';

// --- Types ---
type UserRole = 'Admin' | 'Veterinario' | 'Recepcionista';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  status: 'Sano' | 'En revisión' | 'Crítico';
  diagnosis: string;
  plan?: string;
  owner: string;
  triageColor: 'verde' | 'amarillo' | 'naranja' | 'rojo';
  consultationCost: number;
  lastVisit: string;
}

interface AnalysisResult {
  summary: string;
  risk_level: string;
  ai_observations: string[];
  recommended_tests: string[];
  differential_diagnoses: string[];
  urgency: string;
}

interface ImageAnalysisResult {
  tipo_estudio: string;
  hallazgos_clave: string[];
  sugerencia_diagnostica: string;
  gravedad: string;
  error?: string;
}

interface TriageResult {
  nivel_urgencia: string;
  accion_inmediata: string;
  justificacion: string;
  preguntas_clave: string[];
}

interface SocialContentResult {
  instagram_caption: string;
  tiktok_script: string;
  story_idea: string;
  hashtags_sugeridos: string[];
}

interface AuditResult {
  estado_cumplimiento: string;
  faltantes_detectados: string[];
  sugerencia_legal: string;
  nota_de_privacidad: string;
}

// --- Mock Data ---
const INITIAL_PETS: Pet[] = [
  { 
    id: '1', name: 'Max', species: 'Perro', breed: 'Golden Retriever', 
    age: 5, weight: 32.5, status: 'Sano', diagnosis: 'Control anual', 
    owner: 'Carlos R.', triageColor: 'verde', consultationCost: 1500, lastVisit: '2024-04-01'
  },
  { 
    id: '2', name: 'Luna', species: 'Gato', breed: 'Siamés', 
    age: 2, weight: 4.2, status: 'En revisión', diagnosis: 'Gastroenteritis leve', 
    owner: 'Ana M.', triageColor: 'amarillo', consultationCost: 2200, lastVisit: '2024-04-10'
  },
  { 
    id: '3', name: 'Rocky', breed: 'Bulldog', species: 'Perro',
    age: 8, weight: 28.4, status: 'Crítico', diagnosis: 'Torsión Gástrica', 
    owner: 'Juan P.', triageColor: 'rojo', consultationCost: 8500, lastVisit: '2024-04-12'
  },
  { 
    id: '4', name: 'Bella', species: 'Perro', breed: 'Poodle', 
    age: 3, weight: 6.8, status: 'Sano', diagnosis: 'Vacunación', 
    owner: 'Maria G.', triageColor: 'verde', consultationCost: 1200, lastVisit: '2024-03-25'
  },
  { 
    id: '5', name: 'Simba', species: 'Gato', breed: 'Maine Coon', 
    age: 4, weight: 8.5, status: 'En revisión', diagnosis: 'Otitis', 
    owner: 'Roberto L.', triageColor: 'amarillo', consultationCost: 1800, lastVisit: '2024-04-05'
  }
];

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active = false, onClick, collapsed = false }: { icon: any, label: string, active?: boolean, onClick?: () => void, collapsed?: boolean }) => (
  <div 
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300",
      active 
        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-200" 
        : "text-slate-500 hover:bg-violet-50 hover:text-violet-600",
      collapsed && "justify-center px-0"
    )}
    title={label}
  >
    <Icon size={22} strokeWidth={active ? 2.5 : 2} />
    {!collapsed && <span className="font-bold tracking-tight">{label}</span>}
  </div>
);

const StatCard = ({ label, value, icon: Icon, color, trend }: { label: string, value: string, icon: any, color: string, trend?: string }) => (
  <div className="glass-card glass-card-hover p-7 rounded-[2rem] flex items-center gap-5">
    <div className={cn("p-4 rounded-2xl shadow-inner", color)}>
      <Icon size={28} className="text-white" />
    </div>
    <div className="flex-1">
      <p className="label-micro mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-black text-slate-800 tracking-tighter">{value}</p>
        {trend && (
          <span className="flex items-center gap-0.5 text-xs font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
            <TrendingUp size={12} /> {trend}
          </span>
        )}
      </div>
    </div>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = React.useState('welcome');
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [userRole, setUserRole] = React.useState<UserRole>('Admin');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Data State
  const [pets, setPets] = React.useState<Pet[]>(INITIAL_PETS);
  const [selectedPet, setSelectedPet] = React.useState<Pet>(INITIAL_PETS[0]);
  const [isEditingPet, setIsEditingPet] = React.useState(false);
  const [editForm, setEditForm] = React.useState<Pet>(INITIAL_PETS[0]);
  const [toasts, setToasts] = React.useState<{id: number, message: string}[]>([]);

  // AI Modules State
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [symptoms, setSymptoms] = React.useState('');
  const [analysis, setAnalysis] = React.useState<AnalysisResult | null>(null);
  
  const [imageAnalysis, setImageAnalysis] = React.useState<ImageAnalysisResult | null>(null);
  const [isImageAnalyzing, setIsImageAnalyzing] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const [triageDescription, setTriageDescription] = React.useState('');
  const [triageResult, setTriageResult] = React.useState<TriageResult | null>(null);
  const [isTriaging, setIsTriaging] = React.useState(false);

  const [socialCase, setSocialCase] = React.useState({ patient: '', problem: '', learnings: '' });
  const [socialResult, setSocialResult] = React.useState<SocialContentResult | null>(null);
  const [isGeneratingSocial, setIsGeneratingSocial] = React.useState(false);

  const [auditText, setAuditText] = React.useState('');
  const [auditResult, setAuditResult] = React.useState<AuditResult | null>(null);
  const [isAuditing, setIsAuditing] = React.useState(false);

  // Toast Handler
  const addToast = (message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  // CRUD Handlers
  const handleEditPet = (pet: Pet) => {
    setEditForm(pet);
    setIsEditingPet(true);
  };

  const handleSavePet = () => {
    setPets(prev => prev.map(p => p.id === editForm.id ? editForm : p));
    if (selectedPet.id === editForm.id) setSelectedPet(editForm);
    setIsEditingPet(false);
    addToast('¡Paciente actualizado con éxito!');
  };

  // AI Handlers
  const handleAnalyze = async () => {
    if (!symptoms) return;
    setIsAnalyzing(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const result = await analyzeClinicalCase(selectedPet, symptoms);
    setAnalysis(result);
    
    // Auto-fill fields in the state
    const updatedPet = { 
      ...selectedPet, 
      diagnosis: result.differential_diagnoses[0] || 'Diagnóstico presuntivo',
      plan: result.recommended_tests.join(', ')
    };
    
    setPets(prev => prev.map(p => p.id === selectedPet.id ? updatedPet : p));
    setSelectedPet(updatedPet);
    setIsAnalyzing(false);
    addToast('Análisis clínico completado por Gemini');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!selectedImage || !selectedFile) return;
    setIsImageAnalyzing(true);
    setImageAnalysis(null);
    const base64Data = selectedImage.split(',')[1];
    const result = await analyzeDiagnosticImage(base64Data, selectedFile.type);
    setImageAnalysis(result);
    setIsImageAnalyzing(false);
  };

  const handleTriage = async () => {
    if (!triageDescription) return;
    setIsTriaging(true);
    const result = await classifyTriage(triageDescription);
    setTriageResult(result);
    
    // Update the selected pet if we are in triage mode for a specific pet
    // or just simulate updating the "latest" triage
    if (activeTab === 'triage') {
      const statusMap: Record<string, 'Sano' | 'En revisión' | 'Crítico'> = {
        'Rojo': 'Crítico',
        'Naranja': 'En revisión',
        'Amarillo': 'En revisión',
        'Verde': 'Sano'
      };
      
      const triageColorMap: Record<string, 'rojo' | 'naranja' | 'amarillo' | 'verde'> = {
        'Rojo': 'rojo',
        'Naranja': 'naranja',
        'Amarillo': 'amarillo',
        'Verde': 'verde'
      };

      addToast(`Triaje completado: Nivel ${result.nivel_urgencia}`);
    }
    
    setIsTriaging(false);
  };

  const handleGenerateSocial = async () => {
    if (!socialCase.patient || !socialCase.problem) return;
    setIsGeneratingSocial(true);
    const result = await generateSocialContent(socialCase);
    setSocialResult(result);
    setIsGeneratingSocial(false);
  };

  const handleAudit = async () => {
    if (!auditText) return;
    setIsAuditing(true);
    const result = await auditClinicalRecord(auditText);
    setAuditResult(result);
    setIsAuditing(false);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setImageAnalysis(null);
  };

  const navigateToPatient = (pet: Pet) => {
    setSelectedPet(pet);
    setActiveTab('patient-detail');
    setIsMobileMenuOpen(false);
  };

  const filteredPets = pets.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.breed.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = pets.reduce((acc, p) => acc + p.consultationCost, 0);

  const rolePermissions = {
    Admin: ['welcome', 'dashboard', 'triage', 'imaging', 'marketing', 'audit', 'patient-detail'],
    Veterinario: ['welcome', 'triage', 'imaging', 'audit', 'patient-detail'],
    Recepcionista: ['welcome', 'dashboard', 'triage']
  };

  const isTabVisible = (tab: string) => rolePermissions[userRole].includes(tab);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Toast Notification System */}
      <div className="fixed top-6 right-6 z-[200] flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div 
              key={toast.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10"
            >
              <CheckCircle2 className="text-emerald-400" size={20} />
              <span className="font-bold text-sm tracking-tight">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-violet-100">V</div>
          <span className="font-black tracking-tight text-slate-900">VetAI</span>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={userRole}
            onChange={(e) => setUserRole(e.target.value as UserRole)}
            className="text-xs font-black bg-slate-100 px-3 py-1.5 rounded-full border-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="Admin">Admin</option>
            <option value="Veterinario">Vet</option>
            <option value="Recepcionista">Recep</option>
          </select>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Sidebar (Desktop & Tablet) */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-40 bg-white/80 backdrop-blur-xl border-r border-slate-100 transition-all duration-500 transform",
        isMobileMenuOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0",
        isSidebarOpen ? "w-72" : "w-24",
        "flex flex-col p-8 gap-10"
      )}>
        <div className="hidden lg:flex items-center justify-between px-2">
          {isSidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-violet-200">V</div>
              <span className="text-2xl font-black tracking-tighter text-slate-900">VetAI</span>
            </div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 hover:bg-violet-50 rounded-xl text-slate-400 hover:text-violet-600 transition-all">
            <Menu size={22} />
          </button>
        </div>

        <nav className="flex flex-col gap-3">
          {isTabVisible('welcome') && <SidebarItem icon={Rocket} label="Bienvenida" active={activeTab === 'welcome'} onClick={() => setActiveTab('welcome')} collapsed={!isSidebarOpen} />}
          {isTabVisible('dashboard') && <SidebarItem icon={Activity} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} collapsed={!isSidebarOpen} />}
          {isTabVisible('triage') && <SidebarItem icon={Stethoscope} label="Triaje" active={activeTab === 'triage'} onClick={() => setActiveTab('triage')} collapsed={!isSidebarOpen} />}
          {isTabVisible('imaging') && <SidebarItem icon={ImageIcon} label="Imagen" active={activeTab === 'imaging'} onClick={() => setActiveTab('imaging')} collapsed={!isSidebarOpen} />}
          {isTabVisible('marketing') && <SidebarItem icon={Share2} label="Marketing" active={activeTab === 'marketing'} onClick={() => setActiveTab('marketing')} collapsed={!isSidebarOpen} />}
          {isTabVisible('audit') && <SidebarItem icon={Shield} label="Auditoría" active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} collapsed={!isSidebarOpen} />}
          <div className="h-px bg-slate-100/50 my-6" />
          <SidebarItem icon={Dog} label="Pacientes" collapsed={!isSidebarOpen} />
          <SidebarItem icon={Calendar} label="Agenda" collapsed={!isSidebarOpen} />
          <SidebarItem icon={Settings} label="Ajustes" collapsed={!isSidebarOpen} />
        </nav>

        {isSidebarOpen && (
          <div className="mt-auto p-6 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[2rem] text-white shadow-2xl shadow-violet-200 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-70">Plan Premium</p>
            <p className="text-base font-bold leading-tight mb-4">Acceso total a Gemini AI</p>
            <button className="w-full py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-xs font-black transition-all">
              Ver Detalles
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 pt-24 lg:pt-12 p-6 lg:p-12 overflow-y-auto w-full">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
                {activeTab === 'welcome' ? '¡Bienvenido!' :
                 activeTab === 'dashboard' ? 'Panel de Control' : 
                 activeTab === 'triage' ? 'Triaje de Emergencia' : 
                 activeTab === 'marketing' ? 'Marketing de Contenidos' : 
                 activeTab === 'audit' ? 'Auditoría de Calidad' :
                 activeTab === 'patient-detail' ? `Ficha: ${selectedPet.name}` : 'Diagnóstico por Imagen'}
              </h1>
              <div className="hidden md:block">
                <select 
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as UserRole)}
                  className="text-xs font-black bg-white border border-slate-200 px-4 py-2 rounded-full focus:ring-2 focus:ring-violet-500 shadow-sm"
                >
                  <option value="Admin">Rol: Administrador</option>
                  <option value="Veterinario">Rol: Veterinario</option>
                  <option value="Recepcionista">Rol: Recepcionista</option>
                </select>
              </div>
            </div>
            <p className="text-lg text-slate-400 font-medium">
              {activeTab === 'welcome' ? 'Tu clínica veterinaria inteligente.' :
               activeTab === 'dashboard' ? 'Resumen operativo y clínico.' : 
               activeTab === 'triage' ? 'Clasificación rápida de urgencias.' : 
               activeTab === 'marketing' ? 'Generador de contenido educativo.' : 
               activeTab === 'audit' ? 'Cumplimiento normativo y legal.' :
               activeTab === 'patient-detail' ? `Gestión clínica para ${selectedPet.breed}.` : 'Especialista en Imagen y Laboratorio.'}
            </p>
          </div>
          {activeTab !== 'welcome' && (
            <div className="flex w-full md:w-auto gap-4">
              <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar paciente u dueño..." 
                  className="w-full md:w-72 pl-12 pr-6 py-3.5 bg-white/60 backdrop-blur-md border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all shadow-sm"
                />
              </div>
              <button className="btn-primary flex items-center gap-2">
                <Plus size={22} />
                <span className="hidden sm:inline">Nueva Consulta</span>
              </button>
            </div>
          )}
        </div>

        {/* Views */}
        <AnimatePresence mode="wait">
          {activeTab === 'welcome' && (
            <motion.div 
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col gap-16 py-12"
            >
              <section className="text-center max-w-4xl mx-auto space-y-8">
                <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-violet-100 text-violet-700 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-sm">
                  <Sparkles size={16} /> Inteligencia Artificial Veterinaria
                </div>
                <h2 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9]">
                  El futuro de tu clínica <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-500">empieza hoy.</span>
                </h2>
                <p className="text-xl md:text-2xl text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto">
                  VetAI combina la potencia de Gemini 1.5 con una interfaz intuitiva para que te enfoques en lo que más importa: la salud de tus pacientes.
                </p>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <button onClick={() => setActiveTab('dashboard')} className="glass-card glass-card-hover p-10 rounded-[3rem] text-left group">
                  <div className="w-16 h-16 bg-violet-100 text-violet-600 rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl shadow-violet-100/50">
                    <Plus size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-3">Registrar Paciente</h3>
                  <p className="text-slate-400 font-bold leading-relaxed">Comienza a digitalizar tu clínica hoy mismo.</p>
                </button>
                <div className="glass-card glass-card-hover p-10 rounded-[3rem] text-left group cursor-pointer">
                  <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl shadow-amber-100/50">
                    <Settings size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-3">Configurar Clínica</h3>
                  <p className="text-slate-400 font-bold leading-relaxed">Personaliza tus datos y logo profesional.</p>
                </div>
                <div className="glass-card glass-card-hover p-10 rounded-[3rem] text-left group cursor-pointer">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl shadow-emerald-100/50">
                    <PlayCircle size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-3">Ver Tutorial IA</h3>
                  <p className="text-slate-400 font-bold leading-relaxed">Aprende a usar Gemini para tus diagnósticos.</p>
                </div>
              </div>

              <section className="glass-card p-12 rounded-[4rem] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-violet-500/5 to-transparent pointer-events-none" />
                <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
                  <div className="max-w-md">
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight mb-4">Estadísticas del Mes</h3>
                    <p className="text-slate-400 font-bold mb-8">Tus métricas aparecerán aquí conforme registres actividad. ¡Empieza ahora!</p>
                    <div className="flex gap-6">
                      <div className="text-center">
                        <p className="text-4xl font-black text-slate-200 tracking-tighter">0</p>
                        <p className="label-micro">Pacientes</p>
                      </div>
                      <div className="text-center">
                        <p className="text-4xl font-black text-slate-200 tracking-tighter">0</p>
                        <p className="label-micro">Consultas</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 w-full max-w-md h-48 flex items-end gap-4 opacity-20 grayscale">
                    {[40, 70, 45, 90, 60, 85, 50].map((h, i) => (
                      <div key={i} className="flex-1 bg-slate-200 rounded-t-2xl" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'dashboard' && userRole === 'Recepcionista' && (
            <motion.div 
              key="recep-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-2 space-y-8">
                <section className="glass-card p-8 rounded-[2.5rem]">
                  <h3 className="text-2xl font-black text-slate-800 mb-6 tracking-tight">Agenda del Día</h3>
                  <div className="space-y-4">
                    {[
                      { time: '09:00 AM', patient: 'Max', owner: 'Carlos R.', type: 'Vacunación' },
                      { time: '10:30 AM', patient: 'Luna', owner: 'Ana M.', type: 'Control' },
                      { time: '01:00 PM', patient: 'Bella', owner: 'Maria G.', type: 'Cirugía' },
                    ].map((apt, i) => (
                      <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-xl font-black text-violet-600 text-xs shadow-sm">{apt.time}</div>
                          <div>
                            <p className="font-bold text-slate-800">{apt.patient} <span className="text-slate-400 font-medium">({apt.owner})</span></p>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{apt.type}</p>
                          </div>
                        </div>
                        <button className="p-2 text-slate-400 hover:text-violet-600 transition-all"><ChevronRight size={20} /></button>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="glass-card p-8 rounded-[2.5rem]">
                  <h3 className="text-2xl font-black text-slate-800 mb-6 tracking-tight">Pagos Recientes</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                          <th className="pb-4 px-2">Paciente</th>
                          <th className="pb-4 px-2">Monto</th>
                          <th className="pb-4 px-2">Estado</th>
                          <th className="pb-4 px-2">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {pets.slice(0, 4).map((pet) => (
                          <tr key={pet.id} className="group hover:bg-slate-50/50 transition-all">
                            <td className="py-4 px-2 font-bold text-slate-700">{pet.name}</td>
                            <td className="py-4 px-2 font-black text-slate-900">${pet.consultationCost}</td>
                            <td className="py-4 px-2">
                              <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase">Pagado</span>
                            </td>
                            <td className="py-4 px-2">
                              <button className="p-2 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-violet-600 shadow-sm transition-all"><FileText size={16} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              <div className="space-y-8">
                <StatCard label="Caja Hoy" value="$12,400" icon={DollarSign} color="bg-emerald-500" />
                <StatCard label="Pendientes" value="2" icon={AlertCircle} color="bg-amber-500" />
                <button className="btn-primary w-full py-5 text-lg flex items-center justify-center gap-3">
                  <Plus size={24} /> Registrar Pago
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'dashboard' && userRole !== 'Recepcionista' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Main Column */}
              <div className="lg:col-span-2 flex flex-col gap-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <StatCard label="Ingresos Mes" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} color="bg-emerald-500" trend="+12%" />
                  <StatCard label="Consultas" value={pets.length.toString()} icon={Activity} color="bg-blue-500" trend="+5%" />
                  <StatCard label="Pacientes" value="842" icon={Users} color="bg-indigo-500" />
                </div>

                {/* Patient List (CRUD) */}
                <section className="glass-card p-8 rounded-[2.5rem]">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Pacientes en Clínica</h3>
                    <button className="text-violet-600 text-sm font-black hover:underline tracking-tight">Ver todos</button>
                  </div>
                  <div className="space-y-5">
                    {filteredPets.map((pet) => (
                      <div 
                        key={pet.id} 
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 rounded-[2rem] bg-white/40 border border-white/60 hover:bg-white/80 hover:shadow-xl hover:shadow-violet-100/50 transition-all duration-300 group cursor-pointer"
                        onClick={() => navigateToPatient(pet)}
                      >
                        <div className={cn(
                          "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
                          pet.status === 'Crítico' ? "bg-rose-500 shadow-rose-200" : 
                          pet.status === 'En revisión' ? "bg-amber-400 shadow-amber-200" : "bg-lime-500 shadow-lime-200"
                        )}>
                          <Dog size={32} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <p className="text-lg font-black text-slate-800 tracking-tight">{pet.name}</p>
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                              pet.status === 'Crítico' ? "bg-rose-100 text-rose-600" : 
                              pet.status === 'En revisión' ? "bg-amber-100 text-amber-600" : "bg-lime-100 text-lime-700"
                            )}>{pet.status}</span>
                          </div>
                          <p className="text-sm text-slate-400 font-medium">{pet.breed} • <span className="text-slate-600 font-bold">{pet.diagnosis}</span></p>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                          <div className="text-right mr-4 hidden sm:block">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Costo</p>
                            <p className="text-sm font-bold text-slate-700">${pet.consultationCost}</p>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEditPet(pet); }}
                            className="p-3 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                          >
                            <Edit2 size={20} />
                          </button>
                          <div className="p-3 text-slate-300 group-hover:text-violet-600 group-hover:translate-x-1 transition-all">
                            <ChevronRight size={24} />
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredPets.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-slate-400 font-bold">No se encontraron pacientes que coincidan con tu búsqueda.</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Financial Chart Simulation */}
                <section className="glass-card p-10 rounded-[3rem]">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-xl"><TrendingUp className="text-emerald-600" size={24} /></div>
                      Rendimiento Financiero
                    </h3>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <div className="w-3 h-3 bg-violet-500 rounded-full shadow-lg shadow-violet-200" /> Ingresos
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <div className="w-3 h-3 bg-slate-200 rounded-full" /> Gastos
                      </div>
                    </div>
                  </div>
                  <div className="h-64 flex items-end justify-between gap-6 px-4">
                    {[
                      { m: 'Ene', i: 80, g: 40 },
                      { m: 'Feb', i: 95, g: 45 },
                      { m: 'Mar', i: 110, g: 50 },
                      { m: 'Abr', i: 121, g: 60 },
                    ].map((d, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                        <div className="w-full flex items-end justify-center gap-2 h-full">
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${d.i}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className="w-full max-w-[24px] bg-gradient-to-t from-violet-600 to-indigo-500 rounded-t-xl shadow-lg shadow-violet-100 group-hover:brightness-110 transition-all" 
                          />
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${d.g}%` }}
                            transition={{ duration: 1, delay: i * 0.1 + 0.5 }}
                            className="w-full max-w-[24px] bg-slate-200 rounded-t-xl group-hover:bg-slate-300 transition-all" 
                          />
                        </div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{d.m}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Sidebar Column */}
              <div className="flex flex-col gap-8">
                {/* Quick Triage Summary */}
                <section className="glass-card p-6 rounded-3xl bg-slate-900 text-white">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <HeartPulse className="text-rose-500" />
                    Triaje Activo
                  </h3>
                  <div className="space-y-3">
                    {pets.filter(p => p.status === 'Crítico').map(p => (
                      <div key={p.id} className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
                        <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                        <div>
                          <p className="text-sm font-bold">{p.name}</p>
                          <p className="text-[10px] text-slate-400 uppercase">{p.diagnosis}</p>
                        </div>
                        <button onClick={() => navigateToPatient(p)} className="ml-auto p-1.5 hover:bg-white/10 rounded-lg">
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setActiveTab('triage')} className="w-full mt-6 py-3 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition-all">
                    Nuevo Triaje
                  </button>
                </section>

                {/* AI Marketing Widget */}
                <section className="glass-card p-6 rounded-3xl">
                  <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <Share2 className="text-indigo-600" />
                    Marketing IA
                  </h3>
                  <p className="text-sm text-slate-500 mb-6 leading-relaxed">Convierte tus casos clínicos en contenido viral para atraer nuevos clientes.</p>
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 mb-6">
                    <p className="text-xs font-bold text-indigo-900 mb-1">Idea del día:</p>
                    <p className="text-xs text-indigo-700 italic">"Cómo detectar la torsión gástrica en Bulldogs antes de que sea tarde."</p>
                  </div>
                  <button onClick={() => setActiveTab('marketing')} className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all">
                    Generar Contenido
                  </button>
                </section>

                {/* Audit Status */}
                <section className="glass-card p-6 rounded-3xl">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Shield className="text-emerald-500" />
                    Calidad Legal
                  </h3>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-slate-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-emerald-600">92%</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Cumplimiento Alto</p>
                      <p className="text-xs text-slate-500">3 expedientes pendientes.</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('audit')} className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all">
                    Auditar Expedientes
                  </button>
                </section>
              </div>
            </motion.div>
          )}

          {activeTab === 'patient-detail' && (
            <motion.div 
              key="patient-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-10"
            >
              {/* Header */}
              <section className="glass-card p-10 rounded-[3rem] flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className={cn(
                  "w-40 h-40 rounded-[2.5rem] flex items-center justify-center overflow-hidden border-4 shadow-2xl shrink-0 z-10",
                  selectedPet.status === 'Crítico' ? "border-rose-500 shadow-rose-100" : 
                  selectedPet.status === 'En revisión' ? "border-amber-400 shadow-amber-100" : "border-lime-500 shadow-lime-100"
                )}>
                  <img 
                    src={`https://picsum.photos/seed/${selectedPet.name}/300/300`} 
                    alt={selectedPet.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 text-center md:text-left z-10">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-3">
                    <h2 className="text-5xl font-black text-slate-900 tracking-tighter">{selectedPet.name}</h2>
                    <span className={cn(
                      "px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm",
                      selectedPet.status === 'Crítico' ? "bg-rose-500 text-white" : 
                      selectedPet.status === 'En revisión' ? "bg-amber-400 text-white" : "bg-lime-500 text-white"
                    )}>
                      {selectedPet.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 text-slate-400 font-bold">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-violet-50 text-violet-600 rounded-xl"><Dog size={20} /></div>
                      {selectedPet.species} • {selectedPet.breed}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-violet-50 text-violet-600 rounded-xl"><Calendar size={20} /></div>
                      {selectedPet.age} años
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-violet-50 text-violet-600 rounded-xl"><User size={20} /></div>
                      Dueño: <span className="text-slate-700">{selectedPet.owner}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 z-10">
                  <button onClick={() => handleEditPet(selectedPet)} className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-600 hover:text-violet-600 hover:shadow-xl transition-all shadow-sm">
                    <Edit2 size={24} />
                  </button>
                  <button className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-600 hover:text-violet-600 hover:shadow-xl transition-all shadow-sm">
                    <Share2 size={24} />
                  </button>
                </div>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Clinical Notes */}
                <div className="lg:col-span-2 flex flex-col gap-10">
                  <section className="glass-card p-10 rounded-[3rem]">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-violet-100 text-violet-600 rounded-xl"><Activity size={24} /></div>
                        Notas Clínicas con IA
                      </h3>
                      <div className="px-4 py-1.5 bg-violet-100 text-violet-700 rounded-full text-[10px] font-black uppercase tracking-widest">Gemini 1.5 Flash</div>
                    </div>
                    <textarea 
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      placeholder="Escribe las observaciones del examen físico..."
                      className="w-full h-80 p-8 bg-slate-50/30 border border-slate-100 rounded-[2.5rem] focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all resize-none text-slate-700 leading-relaxed text-lg"
                    />
                    <div className="mt-8 flex justify-end">
                      <button 
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || !symptoms}
                        className="btn-primary flex items-center gap-3 px-10 py-5 text-lg"
                      >
                        {isAnalyzing ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} />}
                        Analizar con Gemini
                      </button>
                    </div>
                  </section>

                  {analysis && (
                    <motion.section 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card p-8 rounded-[2.5rem] border-l-8 border-l-indigo-600"
                    >
                      <h3 className="text-xl font-bold text-slate-800 mb-6">Análisis de IA</h3>
                      <p className="text-slate-600 mb-8 italic leading-relaxed">"{analysis.summary}"</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div className="p-6 bg-violet-50 rounded-3xl border border-violet-100">
                          <h4 className="label-micro mb-2 text-violet-600">Diagnóstico Presuntivo</h4>
                          <p className="text-lg font-black text-slate-800 tracking-tight">{selectedPet.diagnosis}</p>
                        </div>
                        <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                          <h4 className="label-micro mb-2 text-emerald-600">Plan de Tratamiento</h4>
                          <p className="text-lg font-black text-slate-800 tracking-tight">{selectedPet.plan || 'Pendiente de análisis'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <h4 className="label-micro mb-3">Estudios Recomendados</h4>
                          <div className="space-y-2">
                            {analysis.recommended_tests.map((t, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" /> {t}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="label-micro mb-3">Diagnósticos Diferenciales</h4>
                          <div className="flex flex-wrap gap-2">
                            {analysis.differential_diagnoses.map((d, i) => (
                              <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">{d}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.section>
                  )}
                </div>

                {/* Sidebar Widgets */}
                <div className="flex flex-col gap-8">
                  <section className="glass-card p-8 rounded-[2.5rem] bg-slate-900 text-white">
                    <h3 className="text-lg font-bold mb-6">Signos Vitales</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <p className="text-[10px] uppercase font-bold opacity-40 mb-1">Peso</p>
                        <p className="text-xl font-bold">{selectedPet.weight} kg</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <p className="text-[10px] uppercase font-bold opacity-40 mb-1">Temp</p>
                        <p className="text-xl font-bold">38.5 °C</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <p className="text-[10px] uppercase font-bold opacity-40 mb-1">FC</p>
                        <p className="text-xl font-bold">88 lpm</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <p className="text-[10px] uppercase font-bold opacity-40 mb-1">FR</p>
                        <p className="text-xl font-bold">24 rpm</p>
                      </div>
                    </div>
                  </section>

                  <section className="glass-card p-8 rounded-[2.5rem]">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Acciones Rápidas</h3>
                    <div className="space-y-3">
                      <button className="w-full p-4 bg-slate-100 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-200 transition-all">
                        <FileText size={20} className="text-indigo-600" />
                        Generar Receta PDF
                      </button>
                      <button onClick={() => setActiveTab('marketing')} className="w-full p-4 bg-slate-100 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-200 transition-all">
                        <Share2 size={20} className="text-indigo-600" />
                        Crear Post Social
                      </button>
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'triage' && (
            <motion.div 
              key="triage"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-10"
            >
              <section className="glass-card p-10 rounded-[3rem] flex flex-col gap-8">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
                  <div className="p-2 bg-rose-100 text-rose-600 rounded-xl"><Stethoscope size={28} /></div>
                  Evaluación de Triaje
                </h2>
                <textarea 
                  value={triageDescription}
                  onChange={(e) => setTriageDescription(e.target.value)}
                  placeholder="Describe los síntomas de emergencia..."
                  className="w-full h-80 p-8 bg-slate-50/30 border border-slate-100 rounded-[2.5rem] focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all resize-none text-lg text-slate-700"
                />
                <button 
                  onClick={handleTriage}
                  disabled={isTriaging || !triageDescription}
                  className="btn-primary w-full py-5 text-lg flex items-center justify-center gap-3 disabled:bg-slate-300 disabled:shadow-none"
                >
                  {isTriaging ? <Loader2 className="animate-spin" size={24} /> : <AlertCircle size={24} />}
                  Clasificar Urgencia
                </button>
              </section>

              {triageResult && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "glass-card p-10 rounded-[3rem] border-l-[16px] relative overflow-hidden",
                    triageResult.nivel_urgencia === 'Rojo' ? "border-l-rose-600 shadow-rose-100" :
                    triageResult.nivel_urgencia === 'Naranja' ? "border-l-orange-500 shadow-orange-100" :
                    triageResult.nivel_urgencia === 'Amarillo' ? "border-l-amber-400 shadow-amber-100" : "border-l-lime-500 shadow-lime-100"
                  )}
                >
                  <div className="space-y-10">
                    <div>
                      <p className="label-micro mb-2">Nivel de Urgencia</p>
                      <h3 className={cn(
                        "text-7xl font-black uppercase tracking-tighter",
                        triageResult.nivel_urgencia === 'Rojo' ? "text-rose-600" :
                        triageResult.nivel_urgencia === 'Naranja' ? "text-orange-500" :
                        triageResult.nivel_urgencia === 'Amarillo' ? "text-amber-500" : "text-lime-500"
                      )}>
                        {triageResult.nivel_urgencia}
                      </h3>
                    </div>
                    <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl shadow-slate-200">
                      <h4 className="text-rose-400 text-xs font-black uppercase tracking-[0.2em] mb-3">Acción Inmediata</h4>
                      <p className="text-3xl font-bold leading-tight tracking-tight">{triageResult.accion_inmediata}</p>
                    </div>
                    <div>
                      <h4 className="label-micro mb-3">Justificación Clínica</h4>
                      <p className="text-lg text-slate-600 leading-relaxed font-medium">{triageResult.justificacion}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'imaging' && (
            <motion.div 
              key="imaging"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-10"
            >
              <section className="glass-card p-10 rounded-[3rem] flex flex-col gap-8">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
                  <div className="p-2 bg-violet-100 text-violet-600 rounded-xl"><ImageIcon size={28} /></div>
                  Subir Estudio
                </h2>
                <div className={cn(
                  "relative border-4 border-dashed rounded-[3rem] flex flex-col items-center justify-center transition-all overflow-hidden h-96 group",
                  selectedImage ? "border-violet-500" : "border-slate-100 bg-slate-50/30 hover:border-violet-300 hover:bg-violet-50/30"
                )}>
                  {selectedImage ? (
                    <>
                      <img src={selectedImage} alt="Preview" className="w-full h-full object-contain" />
                      <button onClick={clearImage} className="absolute top-6 right-6 p-3 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl text-slate-600 hover:text-rose-500 transition-all"><X size={24} /></button>
                    </>
                  ) : (
                    <label className="flex flex-col items-center gap-6 cursor-pointer w-full h-full justify-center">
                      <div className="p-6 bg-white rounded-3xl shadow-xl text-violet-600 group-hover:scale-110 transition-transform duration-500"><Upload size={40} /></div>
                      <div className="text-center">
                        <p className="text-xl font-black text-slate-800 tracking-tight">Sube una imagen diagnóstica</p>
                        <p className="text-slate-400 font-bold">Radiografías, Ultrasonidos o Laboratorio</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>
                <button 
                  onClick={handleAnalyzeImage}
                  disabled={isImageAnalyzing || !selectedImage}
                  className="btn-primary w-full py-5 text-lg flex items-center justify-center gap-3 disabled:bg-slate-300 disabled:shadow-none"
                >
                  {isImageAnalyzing ? <Loader2 className="animate-spin" size={24} /> : <Activity size={24} />}
                  Analizar Estudio
                </button>
              </section>

              {imageAnalysis && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card p-10 rounded-[3rem]"
                >
                  <div className="space-y-10">
                    <div>
                      <p className="label-micro mb-2">Estudio Detectado</p>
                      <h3 className="text-4xl font-black text-slate-800 tracking-tighter">{imageAnalysis.tipo_estudio}</h3>
                    </div>
                    <div className="p-8 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[2.5rem] text-white shadow-2xl shadow-violet-200">
                      <h4 className="text-violet-300 text-xs font-black uppercase tracking-[0.2em] mb-3">Sugerencia Diagnóstica</h4>
                      <p className="text-2xl font-bold leading-relaxed tracking-tight">{imageAnalysis.sugerencia_diagnostica}</p>
                    </div>
                    <div className="space-y-4">
                      <h4 className="label-micro">Hallazgos Clave</h4>
                      {imageAnalysis.hallazgos_clave.map((h, i) => (
                        <div key={i} className="flex gap-4 p-5 bg-white/40 border border-white/60 rounded-2xl text-base font-medium text-slate-700 shadow-sm">
                          <div className="p-1 bg-amber-100 text-amber-600 rounded-lg shrink-0"><AlertCircle size={20} /></div>
                          {h}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'marketing' && (
            <motion.div 
              key="marketing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-10"
            >
              <section className="glass-card p-10 rounded-[3rem] flex flex-col gap-8">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
                  <div className="p-2 bg-violet-100 text-violet-600 rounded-xl"><Share2 size={28} /></div>
                  Generador de Contenido
                </h2>
                <div className="space-y-6">
                  <input 
                    type="text"
                    value={socialCase.patient}
                    onChange={(e) => setSocialCase({ ...socialCase, patient: e.target.value })}
                    placeholder="Paciente (Ej: Gato Persa)"
                    className="w-full p-5 bg-slate-50/30 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all text-lg font-medium"
                  />
                  <input 
                    type="text"
                    value={socialCase.problem}
                    onChange={(e) => setSocialCase({ ...socialCase, problem: e.target.value })}
                    placeholder="Problema (Ej: Obstrucción Urinaria)"
                    className="w-full p-5 bg-slate-50/30 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all text-lg font-medium"
                  />
                  <textarea 
                    value={socialCase.learnings}
                    onChange={(e) => setSocialCase({ ...socialCase, learnings: e.target.value })}
                    placeholder="Aprendizaje clave..."
                    className="w-full h-40 p-5 bg-slate-50/30 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all resize-none text-lg font-medium leading-relaxed"
                  />
                </div>
                <button 
                  onClick={handleGenerateSocial}
                  disabled={isGeneratingSocial || !socialCase.patient}
                  className="btn-primary w-full py-5 text-lg flex items-center justify-center gap-3 disabled:bg-slate-300 disabled:shadow-none"
                >
                  {isGeneratingSocial ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} />}
                  Generar Contenido Viral
                </button>
              </section>

              {socialResult && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-10"
                >
                  <div className="glass-card p-10 rounded-[3rem] border-l-[12px] border-l-violet-500">
                    <h4 className="text-xs font-black text-violet-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                      <div className="p-1.5 bg-violet-100 rounded-lg"><ImageIcon size={16} /></div>
                      Instagram Caption
                    </h4>
                    <p className="text-lg text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{socialResult.instagram_caption}</p>
                  </div>
                  <div className="glass-card p-10 rounded-[3rem] bg-slate-900 text-white shadow-2xl shadow-slate-200">
                    <h4 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                      <div className="p-1.5 bg-white/10 rounded-lg"><Activity size={16} /></div>
                      TikTok Script
                    </h4>
                    <p className="text-base font-medium text-slate-300 leading-relaxed whitespace-pre-wrap">{socialResult.tiktok_script}</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'audit' && (
            <motion.div 
              key="audit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-10"
            >
              <section className="glass-card p-10 rounded-[3rem] flex flex-col gap-8">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
                  <div className="p-2 bg-violet-100 text-violet-600 rounded-xl"><Shield size={28} /></div>
                  Auditoría de Calidad
                </h2>
                <textarea 
                  value={auditText}
                  onChange={(e) => setAuditText(e.target.value)}
                  placeholder="Pega el expediente clínico aquí..."
                  className="w-full h-80 p-8 bg-slate-50/30 border border-slate-100 rounded-[2.5rem] focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all resize-none text-lg text-slate-700"
                />
                <button 
                  onClick={handleAudit}
                  disabled={isAuditing || !auditText}
                  className="btn-primary w-full py-5 text-lg flex items-center justify-center gap-3 disabled:bg-slate-300 disabled:shadow-none"
                >
                  {isAuditing ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle2 size={24} />}
                  Auditar Expediente
                </button>
              </section>

              {auditResult && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "glass-card p-10 rounded-[3rem] border-l-[16px] relative overflow-hidden",
                    auditResult.estado_cumplimiento === 'Aprobado' ? "border-l-lime-500 shadow-lime-100" : "border-l-amber-400 shadow-amber-100"
                  )}
                >
                  <div className="space-y-10">
                    <div>
                      <p className="label-micro mb-2">Estado de Cumplimiento</p>
                      <h3 className={cn(
                        "text-6xl font-black uppercase tracking-tighter",
                        auditResult.estado_cumplimiento === 'Aprobado' ? "text-lime-500" : "text-amber-500"
                      )}>{auditResult.estado_cumplimiento}</h3>
                    </div>
                    <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl shadow-slate-200">
                      <h4 className="text-violet-400 text-xs font-black uppercase tracking-[0.2em] mb-3">Sugerencia Legal</h4>
                      <p className="text-2xl font-bold leading-tight tracking-tight">{auditResult.sugerencia_legal}</p>
                    </div>
                    <div className="space-y-4">
                      <h4 className="label-micro">Faltantes Detectados</h4>
                      <div className="flex flex-wrap gap-3">
                        {auditResult.faltantes_detectados.map((f, i) => (
                          <div key={i} className="flex gap-3 p-4 bg-white/40 border border-white/60 rounded-2xl text-base font-bold text-rose-600 shadow-sm">
                            <div className="p-1 bg-rose-100 text-rose-500 rounded-lg shrink-0"><AlertCircle size={20} /></div>
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Edit Patient Modal */}
      <AnimatePresence>
        {isEditingPet && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditingPet(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-xl bg-white/90 backdrop-blur-2xl rounded-[3.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] p-12 border border-white"
            >
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Editar Paciente</h3>
                <button onClick={() => setIsEditingPet(false)} className="p-3 hover:bg-rose-50 rounded-2xl text-slate-400 hover:text-rose-500 transition-all"><X size={28} /></button>
              </div>
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="label-micro mb-3 block">Nombre</label>
                    <input 
                      type="text" 
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full p-5 bg-slate-50/50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all text-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="label-micro mb-3 block">Peso (kg)</label>
                    <input 
                      type="number" 
                      value={editForm.weight}
                      onChange={(e) => setEditForm({ ...editForm, weight: parseFloat(e.target.value) })}
                      className="w-full p-5 bg-slate-50/50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all text-lg font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="label-micro mb-3 block">Diagnóstico Actual</label>
                  <input 
                    type="text" 
                    value={editForm.diagnosis}
                    onChange={(e) => setEditForm({ ...editForm, diagnosis: e.target.value })}
                    className="w-full p-5 bg-slate-50/50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all text-lg font-bold"
                  />
                </div>
                <div>
                  <label className="label-micro mb-3 block">Estado Clínico</label>
                  <select 
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full p-5 bg-slate-50/50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all text-lg font-bold appearance-none cursor-pointer"
                  >
                    <option value="Sano">Sano</option>
                    <option value="En revisión">En revisión</option>
                    <option value="Crítico">Crítico</option>
                  </select>
                </div>
                <button 
                  onClick={handleSavePet}
                  className="btn-primary w-full py-5 text-xl flex items-center justify-center gap-3 mt-4"
                >
                  <Save size={24} />
                  Guardar Cambios
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
