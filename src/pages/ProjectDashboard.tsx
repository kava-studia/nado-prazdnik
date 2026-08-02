import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Layers,
  Users,
  BarChart3,
  CheckSquare,
  MessageSquare,
  Wine,
  Plus,
  Send,
  Check,
  Trash2,
  Calendar,
  Sparkles,
  Play,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  MapPin,
  ClipboardList,
  UserCheck,
  UserPlus,
  Search
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';
import ProjectCard from '../components/ProjectCard';
import { 
  EmptyState, 
  PrimaryButton, 
  SecondaryButton, 
  FormField,
  BottomSheet
} from '../components/UI';
import { EventProject, Task, Message, Booking, BudgetCategory, EventPlanItem, CustomGuest } from '../types';
import { getProjects, getActiveProjectId, setActiveProjectId, saveProject } from '../services/eventlyStorage';
import { calculateProjectProgress } from '../utils/projectProgress';
import { resolveNextAction } from '../utils/nextActionResolver';

export default function ProjectDashboard() {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Selected tab state
  const activeTabParam = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState<string>(activeTabParam);

  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab]);

  // Project data states
  const [project, setProject] = useState<EventProject | null>(null);
  const [daysLeft, setDaysLeft] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  // Input states
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('Общее');
  const [chatInput, setChatInput] = useState('');

  // Budget Input States
  const [newBudgetName, setNewBudgetName] = useState('');
  const [newBudgetAllocated, setNewBudgetAllocated] = useState('');

  // Guest List Input States
  const [guestName, setGuestName] = useState('');
  const [guestStatus, setGuestStatus] = useState<'invited' | 'confirmed' | 'declined'>('invited');
  const [guestAge, setGuestAge] = useState<'adult' | 'child'>('adult');
  const [guestDiet, setGuestDiet] = useState('');
  const [guestSearchQuery, setGuestSearchQuery] = useState('');
  const [guestStatusFilter, setGuestStatusFilter] = useState<'all' | 'invited' | 'confirmed' | 'declined'>('all');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Handle direct url mapping and fallback redirection
  useEffect(() => {
    const projects = getProjects();
    
    if (eventId) {
      const found = projects.find(p => p.id === eventId);
      if (found) {
        setProject(found);
        setActiveProjectId(found.id);
      } else {
        // Fallback to active project if eventId is invalid
        const activeId = getActiveProjectId();
        if (activeId && projects.some(p => p.id === activeId)) {
          navigate(`/events/${activeId}`, { replace: true });
        } else if (projects.length > 0) {
          navigate(`/events/${projects[0].id}`, { replace: true });
        } else {
          navigate('/create-event', { replace: true });
        }
      }
    } else {
      // We are on /project, redirect to specific project path
      const activeId = getActiveProjectId();
      if (activeId && projects.some(p => p.id === activeId)) {
        navigate(`/events/${activeId}`, { replace: true });
      } else if (projects.length > 0) {
        navigate(`/events/${projects[0].id}`, { replace: true });
      } else {
        navigate('/create-event', { replace: true });
      }
    }
  }, [eventId, navigate]);

  // Calculate project daysLeft & progressPercent
  useEffect(() => {
    if (!project) return;

    // Days remaining calculation
    if (project.date === 'Дата обсуждается' || !project.date) {
      setDaysLeft(0);
    } else {
      const eventDate = new Date(project.date);
      const today = new Date('2026-07-16T20:30:00'); // Baseline date
      const diffTime = eventDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysLeft(Math.max(0, diffDays));
    }

    // Dynamic Progress
    const progress = calculateProjectProgress(project.planItems || []);
    setProgressPercent(progress);
  }, [project]);

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === 'chat' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, project?.messages]);

  if (!project) {
    return (
      <div className="min-h-screen text-[var(--text-primary)] bg-[var(--background-primary)] flex flex-col justify-between">
        <AppHeader title="План NADO..." />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-t-[var(--gold-primary)] border-r-transparent animate-spin" />
          <p className="text-[var(--text-secondary)] font-bold font-sans">Синхронизируем панель подготовки NADO...</p>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  // Resolve Next Action
  const nextAction = resolveNextAction(project);

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = (project.tasks || []).map((task) => {
      if (task.id === taskId) {
        return { ...task, isCompleted: !task.isCompleted };
      }
      return task;
    });

    const updatedProject = { ...project, tasks: updatedTasks };
    saveProject(updatedProject);
    setProject(updatedProject);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      dueDate: project.date !== 'Дата обсуждается' ? project.date : new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      isCompleted: false,
      category: newTaskCategory
    };

    const updatedProject = {
      ...project,
      tasks: [newTask, ...(project.tasks || [])]
    };

    saveProject(updatedProject);
    setProject(updatedProject);
    setNewTaskTitle('');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'client',
      senderName: 'Вы',
      text: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };

    // AI Auto-response generator based on context helper
    let replyText = 'Интересный вопрос! Служба заботы NADO уже обрабатывает ваше сообщение. Наш дежурный координатор ответит вам здесь в течение 10 минут.';
    const query = chatInput.toLowerCase();
    
    if (query.includes('договор') || query.includes('юрист') || query.includes('подписать') || query.includes('оферт')) {
      replyText = 'По юридическим вопросам вы можете ознакомиться с разделом «Договоры и сметы». Для фиксации условий с площадкой или диджеем мы рекомендуем согласовать OrderTermsSnapshot и подтвердить оферту прямо в приложении.';
    } else if (query.includes('бюджет') || query.includes('деньг') || query.includes('оплат') || query.includes('цена')) {
      replyText = 'Вкладка «Бюджет» поможет вам контролировать распределение. Текущая смета составляет ' + project.budgetTotal.toLocaleString() + ' ₽. Вы можете отметить платежи как оплаченные, чтобы видеть остаток.';
    } else if (query.includes('напитк') || query.includes('алког') || query.includes('калькуля')) {
      replyText = 'Расчет напитков готов во вкладке «Напитки». На ' + project.guestsCount + ' гостей рекомендуется приобрести сбалансированный барный набор. Можете настроить крепость и процент пьющих гостей.';
    } else if (query.includes('диджей') || query.includes('музык') || query.includes('dj')) {
      replyText = 'Для подбора диджея перейдите в раздел «Найти услугу» -> «Диджеи». Вы можете отправить заявку, согласовать райдер и провести безопасный авансовый платеж через платформу.';
    }

    const aiMsg: Message = {
      id: `msg-reply-${Date.now()}`,
      sender: 'contractor',
      senderName: 'Помощник NADO',
      text: replyText,
      timestamp: new Date(Date.now() + 1000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };

    const updatedProject = {
      ...project,
      messages: [...(project.messages || []), userMsg, aiMsg]
    };

    saveProject(updatedProject);
    setProject(updatedProject);
    setChatInput('');
  };

  const handleAddBudgetCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const allocatedNum = parseFloat(newBudgetAllocated);
    if (!newBudgetName.trim() || isNaN(allocatedNum) || allocatedNum <= 0) return;

    const newCategory: BudgetCategory = {
      id: `budget-custom-${Date.now()}`,
      name: newBudgetName.trim(),
      allocated: allocatedNum,
      spent: 0,
      isPaid: false
    };

    const newItems = [...(project.budgetItems || []), newCategory];
    const total = newItems.reduce((acc, curr) => acc + curr.allocated, 0);
    const paid = newItems.reduce((acc, curr) => acc + (curr.isPaid ? curr.allocated : 0), 0);

    const updatedProject: EventProject = {
      ...project,
      budgetItems: newItems,
      budgetTotal: total,
      budgetPaid: paid
    };

    saveProject(updatedProject);
    setProject(updatedProject);
    setNewBudgetName('');
    setNewBudgetAllocated('');
  };

  const handleToggleBudgetPaid = (id: string) => {
    const newItems = (project.budgetItems || []).map((item) => {
      if (item.id === id) {
        const nextPaid = !item.isPaid;
        return { ...item, isPaid: nextPaid, spent: nextPaid ? item.allocated : 0 };
      }
      return item;
    });

    const total = newItems.reduce((acc, curr) => acc + curr.allocated, 0);
    const paid = newItems.reduce((acc, curr) => acc + (curr.isPaid ? curr.allocated : 0), 0);

    const updatedProject: EventProject = {
      ...project,
      budgetItems: newItems,
      budgetTotal: total,
      budgetPaid: paid
    };

    saveProject(updatedProject);
    setProject(updatedProject);
  };

  const handleDeleteBudget = (id: string) => {
    const newItems = (project.budgetItems || []).filter((item) => item.id !== id);

    const total = newItems.reduce((acc, curr) => acc + curr.allocated, 0);
    const paid = newItems.reduce((acc, curr) => acc + (curr.isPaid ? curr.allocated : 0), 0);

    const updatedProject: EventProject = {
      ...project,
      budgetItems: newItems,
      budgetTotal: total,
      budgetPaid: paid
    };

    saveProject(updatedProject);
    setProject(updatedProject);
  };

  // Plan Items Actions
  const handleTogglePlanItemCompleted = (itemId: string) => {
    const updatedPlan = (project.planItems || []).map((item) => {
      if (item.id === itemId) {
        const nextStatus = item.status === 'completed' ? 'not_started' : 'completed';
        return { ...item, status: nextStatus };
      }
      return item;
    });

    const updatedProject = { ...project, planItems: updatedPlan };
    saveProject(updatedProject);
    setProject(updatedProject);
  };

  const handleSkipPlanItem = (itemId: string) => {
    const updatedPlan = (project.planItems || []).map((item) => {
      if (item.id === itemId) {
        return { ...item, status: 'skipped' as const };
      }
      return item;
    });

    const updatedProject = { ...project, planItems: updatedPlan };
    saveProject(updatedProject);
    setProject(updatedProject);
  };

  // Guest List Actions
  const handleAddGuestDashboard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !guestName.trim()) return;

    const newGuest: CustomGuest = {
      id: `guest-${Date.now()}`,
      name: guestName.trim(),
      status: guestStatus,
      ageGroup: guestAge,
      diet: guestDiet.trim()
    };

    const currentList = project.guestsList || [];
    const updatedList = [...currentList, newGuest];

    // Calculate confirmed count for guestsCount
    const confirmedCount = updatedList.filter(g => g.status === 'confirmed').length;

    const updatedProject: EventProject = {
      ...project,
      guestsList: updatedList,
      guestsCount: confirmedCount || project.guestsCount
    };

    saveProject(updatedProject);
    setProject(updatedProject);

    // Reset inputs
    setGuestName('');
    setGuestDiet('');
    setGuestStatus('invited');
    setGuestAge('adult');
  };

  const handleDeleteGuestDashboard = (guestId: string) => {
    if (!project) return;
    const currentList = project.guestsList || [];
    const updatedList = currentList.filter(g => g.id !== guestId);
    
    const confirmedCount = updatedList.filter(g => g.status === 'confirmed').length;

    const updatedProject: EventProject = {
      ...project,
      guestsList: updatedList,
      guestsCount: confirmedCount || project.guestsCount
    };

    saveProject(updatedProject);
    setProject(updatedProject);
  };

  const handleUpdateGuestStatus = (guestId: string, newStatus: 'invited' | 'confirmed' | 'declined') => {
    if (!project) return;
    const currentList = project.guestsList || [];
    const updatedList = currentList.map(g => g.id === guestId ? { ...g, status: newStatus } : g);

    const confirmedCount = updatedList.filter(g => g.status === 'confirmed').length;

    const updatedProject: EventProject = {
      ...project,
      guestsList: updatedList,
      guestsCount: confirmedCount || project.guestsCount
    };

    saveProject(updatedProject);
    setProject(updatedProject);
  };

  const tabs = [
    { id: 'overview', label: 'Обзор', icon: Layers },
    { id: 'plan', label: 'План по шагам', icon: ClipboardList },
    { id: 'guests', label: 'Гости', icon: UserCheck },
    { id: 'team', label: 'Команда', icon: Users },
    { id: 'budget', label: 'Бюджет', icon: BarChart3 },
    { id: 'tasks', label: 'Чек-лист', icon: CheckSquare },
    { id: 'chat', label: 'Организатор', icon: MessageSquare },
    { id: 'drinks', label: 'Напитки', icon: Wine }
  ];

  return (
    <div className="min-h-screen pb-32 flex flex-col justify-between text-[var(--text-primary)] bg-[var(--background-primary)] animate-fade-in" id="project-dashboard-view">
      <AppHeader title="Панель NADO" />

      {/* Premium Ivory Sticky Tabs Navigation */}
      <div className="sticky top-[57px] z-30 bg-[var(--background-secondary)]/92 backdrop-blur-md border-b border-[var(--border-soft)] py-2.5 scrollbar-none overflow-x-auto w-full">
        <div className="flex gap-2 px-4 md:px-8 max-w-4xl mx-auto w-full shrink-0" id="project-dashboard-tabs">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                id={`tab-button-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--gold-highlight)] border-[var(--gold-primary)] text-[var(--gold-deep)] shadow-md'
                    : 'bg-[var(--background-elevated)] border-[var(--border-soft)] hover:border-[var(--gold-primary)]/40 text-[var(--text-secondary)] shadow-sm'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8 text-left">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in" id="tab-content-overview">
              <ProjectCard project={project} daysLeft={daysLeft} progressPercent={progressPercent} />

              {/* HIGHLY VISIBLE RECOMMENDATION STEP / NEXT ACTION BLOCK */}
              <div className="bg-[var(--background-elevated)] border border-[var(--gold-primary)]/30 p-6 relative overflow-hidden shadow-xl rounded-[24px]">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--gold-primary)]/5 blur-3xl pointer-events-none rounded-full" />
                
                <div className="flex items-center gap-2 text-[var(--gold-primary)] text-xs font-bold uppercase tracking-wider mb-3">
                  <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
                  Рекомендуемое действие NADO
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] leading-snug">
                    {nextAction.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    {nextAction.description}
                  </p>
                </div>

                {/* Clear Advice of Why we recommend it and how it links with parameters */}
                <div className="mt-4 bg-[var(--background-secondary)] border border-[var(--border-soft)] rounded-xl p-3.5 text-xs text-[var(--text-secondary)] space-y-2">
                  <p className="font-extrabold text-[var(--text-primary)] text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                    Почему это важно сейчас?
                  </p>
                  <p className="text-xs leading-relaxed">
                    {nextAction.reason}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] italic">
                    *Расчет сбалансирован под {project.guestsCount} человек и город {project.city}.
                  </p>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => navigate(nextAction.route)}
                    className="flex-1 py-3 px-5 premium-gold-button text-xs gap-2 shadow-md"
                  >
                    {nextAction.buttonText}
                    <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>
              </div>

              {/* Plan progress preview quick list */}
              <div className="space-y-3.5">
                <div className="flex justify-between items-center pl-1">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">Основные этапы подготовки</h4>
                  <button
                    onClick={() => setActiveTab('plan')}
                    className="text-xs font-bold text-[var(--color-gold)] hover:underline"
                  >
                    Посмотреть весь план
                  </button>
                </div>

                <div className="premium-glass-card p-5 space-y-3.5">
                  {(project.planItems || []).slice(0, 3).map((item) => {
                    const isDone = item.status === 'completed' || item.status === 'booked';
                    const isSkipped = item.status === 'skipped';
                    return (
                      <div key={item.id} className="flex justify-between items-center text-sm border-b border-[var(--color-border)] pb-2.5 last:border-0 last:pb-0">
                        <div className="text-left space-y-0.5">
                          <span className={`font-bold block ${isDone ? 'text-[var(--color-text-muted)] line-through font-normal' : 'text-[var(--color-text)]'}`}>
                            {item.title}
                          </span>
                          <span className="text-xs text-[var(--color-text-secondary)] font-medium">{item.description}</span>
                        </div>
                        <div className="shrink-0 pl-2">
                          <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                            isDone ? 'bg-[#EAF5EE] text-[#3E8B65]' :
                            isSkipped ? 'bg-[var(--color-background-soft)] text-[var(--color-text-muted)]' :
                            'bg-[#FCF4E7] text-[#694619] border border-[var(--color-gold)]/10'
                          }`}>
                            {isDone ? 'Выполнено' : isSkipped ? 'Пропущено' : 'В плане'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Upcoming Tasks Overview */}
              <div className="space-y-3.5">
                <div className="flex justify-between items-center pl-1">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">Ближайшие задачи из чек-листа</h4>
                  <button
                    onClick={() => setActiveTab('tasks')}
                    className="text-xs font-bold text-[var(--color-gold)] hover:underline"
                  >
                    Все задачи ({project.tasks?.length || 0})
                  </button>
                </div>

                <div className="premium-glass-card p-5 space-y-3.5">
                  {(project.tasks || []).filter((t) => !t.isCompleted).slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTask(task.id)}
                      className="flex gap-3 items-start cursor-pointer hover:bg-[var(--color-background-soft)] p-1.5 rounded-xl transition-all group"
                    >
                      <div className="w-5 h-5 rounded border border-[var(--color-border)] flex items-center justify-center shrink-0 mt-0.5 group-hover:border-[var(--color-gold)] transition-colors bg-white">
                        <Check className="w-3.5 h-3.5 text-transparent" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-[var(--color-text)] leading-tight">{task.title}</p>
                        <span className="text-xs text-[var(--color-text-secondary)] font-mono uppercase tracking-wider block mt-0.5">{task.category}</span>
                      </div>
                    </div>
                  ))}
                  {(!project.tasks || project.tasks.filter((t) => !t.isCompleted).length === 0) && (
                    <p className="text-sm text-[var(--color-text-secondary)] italic text-center py-4 font-normal">Все задачи завершены!</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: PLAN ПО ШАГАМ */}
          {activeTab === 'plan' && (
            <div className="space-y-6 animate-fade-in" id="tab-content-plan">
              <div className="space-y-1.5 text-left">
                <h3 className="text-xl font-bold text-[var(--color-text)]">План подготовки по шагам</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Последовательные этапы сбора вашего мероприятия. Завершайте или пропускайте разделы по мере готовности.
                </p>
              </div>

              <div className="space-y-4 text-left">
                {(project.planItems || []).map((item) => {
                  const isDone = item.status === 'completed' || item.status === 'booked';
                  const isSkipped = item.status === 'skipped';

                  return (
                    <div 
                      key={item.id}
                      className={`rounded-2xl p-5 border text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                        isDone 
                          ? 'bg-white/45 border-[var(--color-border)] opacity-70 shadow-sm' 
                          : isSkipped 
                            ? 'bg-white/30 border-[var(--color-border)] opacity-60'
                            : 'bg-white border-[var(--color-border)] hover:border-[var(--color-gold-light)] shadow-sm'
                      }`}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-base font-bold ${isDone ? 'text-[var(--color-text-muted)] line-through' : 'text-[var(--color-text)]'}`}>
                            {item.title}
                          </span>
                          {!item.required && (
                            <span className="text-xs text-[var(--color-text-secondary)] font-bold border border-[var(--color-border)] px-2 py-0.5 rounded-full uppercase">
                              Опционально
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{item.description}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        {!isDone && !isSkipped && (
                          <>
                            <button
                              onClick={() => handleTogglePlanItemCompleted(item.id)}
                              className="px-3.5 py-1.5 bg-[#EAF5EE] text-[#3E8B65] text-xs font-bold rounded-xl hover:bg-[#3E8B65]/10 cursor-pointer"
                            >
                              Выполнено
                            </button>
                            {!item.required && (
                              <button
                                onClick={() => handleSkipPlanItem(item.id)}
                                className="px-3.5 py-1.5 bg-[var(--color-background-soft)] text-[var(--color-text-secondary)] text-xs font-bold rounded-xl hover:bg-[var(--color-border)] cursor-pointer"
                              >
                                Пропустить
                              </button>
                            )}
                          </>
                        )}
                        {isDone && (
                          <button
                            onClick={() => handleTogglePlanItemCompleted(item.id)}
                            className="text-xs font-bold text-[var(--color-gold)] hover:underline"
                          >
                            Вернуть в план
                          </button>
                        )}
                        {isSkipped && (
                          <button
                            onClick={() => handleTogglePlanItemCompleted(item.id)}
                            className="text-xs font-bold text-[var(--color-gold)] hover:underline"
                          >
                            Вернуть в план
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: GUESTS */}
          {activeTab === 'guests' && (
            <div className="space-y-6 animate-fade-in text-left" id="tab-content-guests">
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-[var(--color-text)]">Список гостей</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Управляйте составом гостей вашего праздника, отслеживайте подтверждения (RSVP) и диетические пожелания.
                </p>
              </div>

              {/* Guest Summary Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="premium-glass-card p-4 text-center rounded-[20px] shadow-sm">
                  <span className="text-xs uppercase font-bold tracking-wider text-[var(--color-text-secondary)]">Всего в списке</span>
                  <p className="text-2xl font-black text-[var(--color-text)] mt-1">{(project.guestsList || []).length}</p>
                </div>
                <div className="premium-glass-card p-4 text-center rounded-[20px] shadow-sm">
                  <span className="text-xs uppercase font-bold tracking-wider text-[#3E8B65]">Подтвердили</span>
                  <p className="text-2xl font-black text-[#3E8B65] mt-1">
                    {(project.guestsList || []).filter(g => g.status === 'confirmed').length}
                  </p>
                </div>
                <div className="premium-glass-card p-4 text-center rounded-[20px] shadow-sm">
                  <span className="text-xs uppercase font-bold tracking-wider text-[var(--color-text-secondary)]">Ожидают</span>
                  <p className="text-2xl font-black text-[var(--color-text)] mt-1">
                    {(project.guestsList || []).filter(g => g.status === 'invited').length}
                  </p>
                </div>
                <div className="premium-glass-card p-4 text-center rounded-[20px] shadow-sm">
                  <span className="text-xs uppercase font-bold tracking-wider text-[#B94D4D]">Отказались</span>
                  <p className="text-2xl font-black text-[#B94D4D] mt-1">
                    {(project.guestsList || []).filter(g => g.status === 'declined').length}
                  </p>
                </div>
              </div>

              {/* Add Guest Form */}
              <form onSubmit={handleAddGuestDashboard} className="premium-glass-card p-5 space-y-4 shadow-sm rounded-[24px]">
                <h4 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-1.5">
                  <UserPlus className="w-4.5 h-4.5 text-[var(--color-gold-deep)]" />
                  Добавить гостя
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="ФИО гостя *"
                    placeholder="Например: Смирнов Андрей"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                  />
                  <div>
                    <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase pl-1 block mb-1">
                      Статус приглашения
                    </label>
                    <select
                      value={guestStatus}
                      onChange={(e) => setGuestStatus(e.target.value as any)}
                      className="w-full p-2.5 bg-white border border-[var(--color-border)] text-xs text-[var(--color-text)] rounded-xl focus:outline-none focus:border-[var(--color-gold)]"
                    >
                      <option value="invited">Приглашён (Ожидание)</option>
                      <option value="confirmed">Подтвердил участие</option>
                      <option value="declined">Отказался</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase pl-1 block mb-1">
                      Возрастная группа
                    </label>
                    <select
                      value={guestAge}
                      onChange={(e) => setGuestAge(e.target.value as any)}
                      className="w-full p-2.5 bg-white border border-[var(--color-border)] text-xs text-[var(--color-text)] rounded-xl focus:outline-none focus:border-[var(--color-gold)]"
                    >
                      <option value="adult">Взрослый</option>
                      <option value="child">Ребёнок</option>
                    </select>
                  </div>
                  <FormField
                    label="Особое меню, диета"
                    placeholder="Например: вегетарианец, без лактозы"
                    value={guestDiet}
                    onChange={(e) => setGuestDiet(e.target.value)}
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <PrimaryButton type="submit" className="px-5 py-2.5 font-bold flex items-center gap-1.5 text-sm shadow-md">
                    <Plus className="w-4 h-4 font-extrabold" /> Сохранить гостя
                  </PrimaryButton>
                </div>
              </form>

              {/* Guest List Grid/Table */}
              <div className="premium-glass-card p-5 space-y-4 shadow-sm rounded-[24px]">
                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center border-b border-[var(--color-border)] pb-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
                    <input
                      type="text"
                      placeholder="Поиск по имени гостя..."
                      value={guestSearchQuery}
                      onChange={(e) => setGuestSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-[var(--color-border)] text-xs text-[var(--color-text)] rounded-xl focus:outline-none focus:border-[var(--color-gold)]"
                    />
                  </div>
                  
                  <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    {(['all', 'invited', 'confirmed', 'declined'] as const).map((filter) => {
                      const isSelected = guestStatusFilter === filter;
                      const label = filter === 'all' ? 'Все' : filter === 'invited' ? 'Приглашён' : filter === 'confirmed' ? 'Да' : 'Нет';
                      return (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => setGuestStatusFilter(filter)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                            isSelected
                              ? 'bg-[var(--color-gold-light)] border-[var(--color-gold)] text-[var(--color-gold-deep)]'
                              : 'bg-white border-[var(--color-border)] hover:border-[var(--color-gold)]/55 text-[var(--color-text-secondary)]'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filtered List Display */}
                {(() => {
                  const rawList = project.guestsList || [];
                  const filtered = rawList.filter((guest) => {
                    const matchesSearch = guest.name.toLowerCase().includes(guestSearchQuery.toLowerCase());
                    const matchesFilter = guestStatusFilter === 'all' || guest.status === guestStatusFilter;
                    return matchesSearch && matchesFilter;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-12 text-xs text-[var(--color-text-secondary)]">
                        {rawList.length === 0 ? (
                          'Список гостей пуст. Добавьте первого гостя выше.'
                        ) : (
                          'По заданным фильтрам гости не найдены.'
                        )}
                      </div>
                    );
                  }

                  return (
                    <div className="divide-y divide-[var(--color-border)]">
                      {filtered.map((guest) => (
                        <div key={guest.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="min-w-0">
                            <p className="font-bold text-[var(--color-text)] text-sm truncate">{guest.name}</p>
                            <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-xs text-[var(--color-text-secondary)] mt-1">
                              <span className="px-1.5 py-0.5 bg-[var(--color-background-soft)] rounded text-[var(--color-text)]">
                                {guest.ageGroup === 'adult' ? 'Взрослый' : 'Ребёнок'}
                              </span>
                              {guest.diet && (
                                <span className="px-1.5 py-0.5 bg-[var(--color-gold-light)]/40 rounded text-[var(--color-gold-deep)] font-semibold">
                                  🍽️ {guest.diet}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-auto">
                            {/* Fast status switcher select */}
                            <select
                              value={guest.status}
                              onChange={(e) => handleUpdateGuestStatus(guest.id, e.target.value as any)}
                              className={`p-1.5 bg-white border text-xs font-bold uppercase rounded-lg focus:outline-none cursor-pointer ${
                                guest.status === 'confirmed'
                                  ? 'border-[#3E8B65]/40 text-[#3E8B65] bg-[#EAF5EE]/40'
                                  : guest.status === 'declined'
                                    ? 'border-[#B94D4D]/40 text-[#B94D4D] bg-[#FDF0F0]/40'
                                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'
                              }`}
                            >
                              <option value="invited">Приглашён</option>
                              <option value="confirmed">Подтвердил</option>
                              <option value="declined">Отказался</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => handleDeleteGuestDashboard(guest.id)}
                              className="p-1.5 bg-[#FDF0F0] hover:bg-[#FDF0F0]/80 text-[#B94D4D] rounded-lg transition-colors cursor-pointer shrink-0"
                              title="Удалить"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB: TEAM */}
          {activeTab === 'team' && (
            <div className="space-y-6 animate-fade-in" id="tab-content-team">
              <div className="space-y-1.5 text-left">
                <h3 className="text-xl font-bold text-[var(--color-text)]">Команда проекта</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Принятые заявки от подрядчиков платформы. Сделки защищены стандартами OrderTermsSnapshot.
                </p>
              </div>

              <div className="space-y-4">
                {(project.bookings || []).map((b) => (
                  <div key={b.id} className="premium-glass-card p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left shadow-sm">
                    <div className="flex gap-4 items-center">
                      <img
                        src={b.contractorImage || 'https://images.unsplash.com/photo-1516873240891-4bf014598ab4?w=150'}
                        alt={b.contractorName}
                        className="w-12 h-12 rounded-full object-cover border border-[var(--color-gold)]/20"
                      />
                      <div>
                        <h4 className="font-bold text-sm sm:text-base text-[var(--color-text)]">{b.contractorName}</h4>
                        <span className="text-xs text-[var(--color-text-secondary)] block mt-0.5">{b.selectedService}</span>
                      </div>
                    </div>

                    <div className="text-right flex sm:flex-col justify-between w-full sm:w-auto items-center sm:items-end gap-2 border-t sm:border-t-0 border-[var(--color-border)] pt-3 sm:pt-0">
                      <span className="text-xs sm:text-sm font-bold text-[var(--color-gold-deep)] font-mono">
                        {(b.totalPrice || 0).toLocaleString()} ₽
                      </span>
                      <button
                        onClick={() => navigate(`/events/${project.id}/contractors/${b.contractorId}`)}
                        className="text-xs font-bold text-[var(--color-gold)] hover:underline"
                      >
                        Подробнее о контракте
                      </button>
                    </div>
                  </div>
                ))}

                {(!project.bookings || project.bookings.length === 0) && (
                  <EmptyState
                    title="Команда пока пуста"
                    description="Отправьте заявку ведущему, диджею или площадке в каталоге, чтобы начать формировать команду."
                    ctaText="Перейти в каталог"
                    onCtaClick={() => navigate('/search')}
                  />
                )}
              </div>
            </div>
          )}

          {/* TAB: BUDGET */}
          {activeTab === 'budget' && (
            <div className="space-y-6 animate-fade-in text-left" id="tab-content-budget">
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-[var(--color-text)]">Распределение бюджета</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Сбалансированное распределение сметы под {project.guestsCount} гостей. Добавляйте свои статьи расходов.
                </p>
              </div>

              {/* Form to add custom budget category */}
              <form onSubmit={handleAddBudgetCategory} className="premium-glass-card p-5 space-y-4 shadow-sm">
                <h4 className="font-bold text-sm text-[var(--color-text)]">Добавить свою статью расходов</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Название статьи"
                    placeholder="Например, Покупка колец или Костюм"
                    value={newBudgetName}
                    onChange={(e) => setNewBudgetName(e.target.value)}
                  />
                  <FormField
                    label="Сумма (₽)"
                    placeholder="Например, 50000"
                    type="number"
                    value={newBudgetAllocated}
                    onChange={(e) => setNewBudgetAllocated(e.target.value)}
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <PrimaryButton type="submit" className="px-5 py-2.5 font-bold flex items-center gap-1 text-sm shadow-md">
                    <Plus className="w-4 h-4 font-extrabold" /> Добавить в смету
                  </PrimaryButton>
                </div>
              </form>

              {/* Budget grid with list */}
              <div className="premium-glass-card p-5 space-y-4 shadow-sm" id="budget-items-list">
                {(project.budgetItems || []).map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center text-sm border-b border-[var(--color-border)] pb-3 last:border-0 last:pb-0"
                  >
                    <div className="text-left space-y-1 pr-2">
                      <span className="font-bold block text-[var(--color-text)]">{item.name}</span>
                      <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)] font-mono">
                        <span>Лимит: {item.allocated.toLocaleString()} ₽</span>
                        <span>•</span>
                        <button
                          onClick={() => handleToggleBudgetPaid(item.id)}
                          className={`font-bold transition-colors ${item.isPaid ? 'text-[#3E8B65]' : 'text-[var(--color-gold)]'}`}
                        >
                          {item.isPaid ? '✓ Оплачено' : 'Отметить как оплачено'}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-xs sm:text-sm font-bold text-[var(--color-text)] font-mono">
                        {item.allocated.toLocaleString()} ₽
                      </span>
                      {item.id.includes('custom') && (
                        <button
                          onClick={() => handleDeleteBudget(item.id)}
                          className="text-[var(--color-error)] hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: TASKS (CHECKLIST) */}
          {activeTab === 'tasks' && (
            <div className="space-y-6 animate-fade-in text-left" id="tab-content-tasks">
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-[var(--color-text)]">Чек-лист задач</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Задачи подготовки, сбалансированные под ваше мероприятие. Добавляйте личные напоминания.
                </p>
              </div>

              {/* Form to add custom task */}
              <form onSubmit={handleAddTask} className="premium-glass-card p-5 space-y-4 shadow-sm">
                <h4 className="font-bold text-sm text-[var(--color-text)]">Добавить задачу</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Что нужно сделать?"
                    placeholder="Например, Заказать свадебный букет"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                  />
                  <FormField
                    label="Категория"
                    as="select"
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value)}
                  >
                    <option value="Общее">Общее</option>
                    <option value="Площадка">Площадка</option>
                    <option value="Команда">Команда</option>
                    <option value="Банкет">Банкет</option>
                    <option value="Напитки">Напитки</option>
                    <option value="Образы">Образы</option>
                    <option value="Оформление">Оформление</option>
                  </FormField>
                </div>
                
                <div className="flex justify-end pt-1">
                  <PrimaryButton type="submit" className="px-5 py-2.5 font-bold flex items-center gap-1 text-sm shadow-md">
                    <Plus className="w-4 h-4 font-extrabold" /> Добавить задачу
                  </PrimaryButton>
                </div>
              </form>

              {/* Tasks list */}
              <div className="premium-glass-card p-5 space-y-4 shadow-sm" id="tasks-checklist">
                {(project.tasks || []).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task.id)}
                    className="flex gap-4 items-start cursor-pointer hover:bg-[var(--color-background-soft)] p-2 rounded-xl transition-all group text-left"
                    id={`task-item-${task.id}`}
                  >
                    <div
                      className={`w-5.5 h-5.5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer bg-white ${
                        task.isCompleted
                          ? 'bg-gradient-to-r from-[var(--color-gold-deep)] to-[var(--color-gold-light)] border-[var(--color-gold)] text-white'
                          : 'border-[var(--color-border)] group-hover:border-[var(--color-gold)] text-transparent'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <p
                        className={`text-sm font-bold leading-tight transition-colors ${
                          task.isCompleted ? 'text-[var(--color-text-secondary)] line-through font-normal' : 'text-[var(--color-text)]'
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="flex justify-between items-center text-xs text-[var(--color-text-secondary)] font-mono uppercase tracking-wider">
                        <span>{task.category}</span>
                        <span>до {task.dueDate}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {(project.tasks || []).length === 0 && (
                  <p className="text-sm text-[var(--color-text-secondary)] italic text-center py-6 font-normal">Задач в чек-листе пока нет.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB: CHAT */}
          {activeTab === 'chat' && (
            <div className="space-y-4 animate-fade-in flex flex-col h-[550px] justify-between text-left" id="tab-content-chat">
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Диалог с помощником NADO</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Задавайте любые вопросы по поиску подрядчиков, юридическим договорам, оплатам или таймингу в чате заботы NADO.
                </p>
              </div>

              {/* Messages container */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-4 py-2 border-y border-[var(--border-soft)] bg-[var(--background-secondary)]/40 rounded-xl px-2" id="chat-messages-container">
                {(project.messages || []).map((msg) => {
                  const isClient = msg.sender === 'client';
                  const isSystem = msg.sender === 'system';

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="text-center py-2">
                        <span className="inline-block bg-[var(--gold-highlight)] border border-[var(--gold-primary)]/10 rounded-full px-4 py-1.5 text-xs text-[var(--gold-deep)] font-extrabold leading-relaxed max-w-sm">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[85%] ${isClient ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      <span className="text-xs text-[var(--text-secondary)] mb-1 font-semibold px-1">
                        {msg.senderName} • {msg.timestamp}
                      </span>
                      
                      <div
                        className={`p-3.5 rounded-2xl text-sm leading-relaxed text-left ${
                          isClient
                            ? 'bg-[var(--gold-highlight)] border border-[var(--gold-primary)]/20 text-[var(--gold-deep)] font-extrabold rounded-tr-sm shadow-sm'
                            : 'bg-[var(--background-elevated)] border border-[var(--border-soft)] text-[var(--text-primary)] rounded-tl-sm shadow-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendMessage} className="flex gap-2.5 items-center">
                <input
                  type="text"
                  placeholder="Задать вопрос службе NADO..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 min-h-[48px] bg-[var(--background-elevated)] border border-[var(--border-strong)] focus:border-[var(--gold-primary)] rounded-xl px-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-all"
                  id="chat-input"
                  required
                />
                <PrimaryButton
                  type="submit"
                  className="min-h-[48px] px-5 shrink-0 flex items-center justify-center rounded-xl shadow-md"
                  id="chat-send-button"
                >
                  <Send className="w-5 h-5" />
                </PrimaryButton>
              </form>
            </div>
          )}

          {/* TAB: DRINKS */}
          {activeTab === 'drinks' && (
            <div className="space-y-6 animate-fade-in text-left" id="tab-content-drinks">
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-[var(--color-text)]">Расчет карты напитков</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Сбалансированное барное меню. Настроено на основе ваших гостей и пробкового сбора.
                </p>
              </div>

              {project.drinksCalculation ? (
                <div className="space-y-6">
                  {/* Financial metrics */}
                  <div className="premium-glass-card p-5 grid grid-cols-2 gap-4 text-center shadow-sm">
                    <div className="text-center p-3 bg-white border border-[var(--color-border)] rounded-xl shadow-sm">
                      <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider font-bold mb-1">Смета напитков</p>
                      <p className="text-lg font-black text-[var(--color-gold)] font-mono">
                        {project.drinksCalculation.totalPrice?.toLocaleString('ru-RU') || 0} ₽
                      </p>
                    </div>
                    <div className="text-center p-3 bg-white border border-[var(--color-border)] rounded-xl shadow-sm">
                      <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider font-bold mb-1">Пробковый сбор</p>
                      <p className="text-lg font-black text-[var(--color-text)] font-mono">
                        {project.drinksCalculation.corkFeeTotal?.toLocaleString('ru-RU') || 0} ₽
                      </p>
                    </div>
                  </div>

                  {/* Calculations details */}
                  <div className="premium-glass-card p-5 space-y-4 shadow-sm">
                    <h4 className="font-bold text-sm text-[var(--color-text)] border-b border-[var(--color-border)] pb-2">Рекомендованный объём закупки</h4>
                    {project.drinksCalculation.items && project.drinksCalculation.items.map((drinkItem: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-sm border-b border-[var(--color-border)] pb-2.5 last:border-0 last:pb-0">
                        <div>
                          <p className="font-bold text-[var(--color-text)]">{drinkItem.drinkType}</p>
                          <span className="text-xs text-[var(--color-text-secondary)]">Рекомендовано {drinkItem.bottlesCount} бутылок по {drinkItem.bottleVolume}л</span>
                        </div>
                        <span className="text-sm font-bold text-[var(--color-gold-deep)] font-mono">{drinkItem.estimatedPrice?.toLocaleString('ru-RU')} ₽</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center">
                    <SecondaryButton onClick={() => navigate('/drinks-calculator')} className="max-w-xs shadow-sm">
                      Открыть калькулятор напитков
                    </SecondaryButton>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="Расчет напитков пока не сделан"
                  description="Запустите алкогольный калькулятор, чтобы сформировать барную смету под ваших гостей и концепцию меню."
                  ctaText="Рассчитать напитки"
                  onCtaClick={() => navigate('/drinks-calculator')}
                />
              )}
            </div>
          )}

        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
