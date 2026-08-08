import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Gauge,
  LayoutDashboard,
  PartyPopper,
  Play,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  WalletCards,
  Wrench
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';
import { useDemoMode } from '../context/DemoModeContext';
import {
  PRESENTATION_METRICS,
  PRESENTATION_ROLES,
  type PresentationRoleId
} from '../demo/presentation';

const roleIcons: Record<PresentationRoleId, typeof UserRound> = {
  client: UserRound,
  contractor: Wrench,
  organizer: BriefcaseBusiness,
  venue: Building2,
  owner: ShieldCheck
};

const pitchSteps = [
  { time: '1 мин', title: 'Задача клиента', text: 'Один запрос превращается в понятный проект.', icon: PartyPopper },
  { time: '2 мин', title: 'Готовый праздник', text: 'Покажите команду, смету, задачи и план подготовки.', icon: Gauge },
  { time: '2 мин', title: 'Экосистема ролей', text: 'Переключите исполнителя, площадку и организатора.', icon: UsersRound },
  { time: '2 мин', title: 'Контроль владельца', text: 'Завершите безопасностью, договорами и аудитом.', icon: ShieldCheck }
];

export default function DemoPresentation() {
  const navigate = useNavigate();
  const { setDemoScenario } = useDemoMode();

  const openScenario = (scenario: Parameters<typeof setDemoScenario>[0], path: string) => {
    setDemoScenario(scenario);
    navigate(path);
  };

  return (
    <div className="min-h-screen pb-28 bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans">
      <AppHeader />

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-7 sm:py-10 space-y-7 sm:space-y-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-[var(--border-primary)] bg-[var(--surface-primary)] shadow-xl p-6 sm:p-9 lg:p-11">
          <div className="absolute -top-32 -right-24 h-80 w-80 rounded-full bg-[var(--gold-primary)]/12 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 left-1/3 h-72 w-72 rounded-full bg-[#496E9C]/10 blur-3xl pointer-events-none" />

          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--gold-primary)]/35 bg-[var(--gold-primary)]/8 px-3.5 py-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--gold-primary)]">
                <Sparkles className="h-3.5 w-3.5" />
                Презентационный режим
              </div>

              <div className="space-y-4">
                <h1 className="max-w-3xl text-3xl sm:text-5xl lg:text-6xl font-black tracking-[-0.04em] leading-[0.98]">
                  Один праздник.
                  <span className="block text-[var(--gold-primary)]">Одна управляемая система.</span>
                </h1>
                <p className="max-w-2xl text-sm sm:text-lg leading-relaxed text-[var(--text-secondary)]">
                  NADO соединяет клиента, площадку, исполнителей, организатора и владельца платформы — от первого запроса до закрытого проекта.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => openScenario('event_ready', '/events/demo-proj-ready')}
                  className="premium-gold-button min-h-12 gap-2 px-6 py-3.5 text-sm"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Открыть готовый проект
                </button>
                <button
                  type="button"
                  onClick={() => openScenario('empty_client', '/create-event')}
                  className="min-h-12 inline-flex items-center justify-center gap-2 rounded-[14px] border border-[var(--border-strong)] bg-[var(--surface-secondary)] px-6 py-3.5 text-sm font-bold transition hover:border-[var(--gold-primary)]/55 active:scale-[0.98]"
                >
                  Пройти путь с нуля
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#151D2D] to-[#263550] p-5 sm:p-6 text-white shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#DFC88F]">Демо проект</div>
                  <h2 className="mt-2 text-xl sm:text-2xl font-black">Свадьба Константина и Натальи</h2>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-white/10 text-[#DFC88F]">
                  <PartyPopper className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-white/7 p-3.5">
                  <CalendarDays className="mb-2 h-4 w-4 text-[#DFC88F]" />
                  <div className="text-xs text-white/55">Дата</div>
                  <div className="mt-1 font-bold">18 сентября</div>
                </div>
                <div className="rounded-2xl bg-white/7 p-3.5">
                  <WalletCards className="mb-2 h-4 w-4 text-[#DFC88F]" />
                  <div className="text-xs text-white/55">Бюджет</div>
                  <div className="mt-1 font-bold">750 000 ₽</div>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-white/60">Готовность проекта</span>
                  <span className="text-[#DFC88F]">90%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[90%] rounded-full bg-gradient-to-r from-[#B5893F] to-[#DFC88F]" />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center">
                <div><div className="text-lg font-black">50</div><div className="text-[10px] text-white/50">гостей</div></div>
                <div><div className="text-lg font-black">2</div><div className="text-[10px] text-white/50">брони</div></div>
                <div><div className="text-lg font-black">3</div><div className="text-[10px] text-white/50">этапа</div></div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" aria-label="Возможности прототипа">
          {PRESENTATION_METRICS.map((metric) => (
            <div key={metric.label} className="rounded-2xl sm:rounded-3xl border border-[var(--border-primary)] bg-[var(--surface-primary)] p-4 sm:p-5 shadow-sm">
              <div className="text-2xl sm:text-3xl font-black text-[var(--gold-primary)]">{metric.value}</div>
              <div className="mt-1 text-xs sm:text-sm leading-snug text-[var(--text-secondary)]">{metric.label}</div>
            </div>
          ))}
        </section>

        <section className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[var(--gold-primary)]">Единая экосистема</div>
              <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight">Покажите продукт глазами каждой роли</h2>
            </div>
            <p className="max-w-md text-sm text-[var(--text-secondary)] sm:text-right">Один клик перестраивает данные и открывает нужный рабочий кабинет.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {PRESENTATION_ROLES.map((role) => {
              const Icon = roleIcons[role.id];
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => openScenario(role.scenario, role.path)}
                  className="group min-h-[220px] rounded-3xl border border-[var(--border-primary)] bg-[var(--surface-primary)] p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-[var(--gold-primary)]/45 hover:shadow-xl active:translate-y-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-secondary)] text-[var(--gold-primary)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-[var(--text-muted)] transition group-hover:translate-x-1 group-hover:text-[var(--gold-primary)]" />
                  </div>
                  <div className="mt-7 text-[10px] font-black uppercase tracking-[0.15em] text-[var(--gold-primary)]">{role.eyebrow}</div>
                  <h3 className="mt-1.5 text-xl font-black">{role.label}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">{role.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-3xl border border-[var(--border-primary)] bg-gradient-to-br from-[#151D2D] to-[#263550] p-6 sm:p-8 text-white shadow-xl">
            <LayoutDashboard className="h-8 w-8 text-[#DFC88F]" />
            <div className="mt-7 text-xs font-black uppercase tracking-[0.18em] text-[#DFC88F]">Главная мысль встречи</div>
            <h2 className="mt-3 text-2xl sm:text-3xl font-black leading-tight">NADO не ищет отдельного подрядчика. NADO собирает весь праздник.</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/65">Ценность продукта появляется на стыке ролей, данных, договорённостей и контроля исполнения.</p>
          </div>

          <div className="rounded-3xl border border-[var(--border-primary)] bg-[var(--surface-primary)] p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <Clock3 className="h-5 w-5 text-[var(--gold-primary)]" />
              <h2 className="text-xl font-black">Сценарий показа за 7 минут</h2>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {pitchSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="flex gap-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-secondary)]/55 p-4">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--surface-primary)] text-[var(--gold-primary)] shadow-sm">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">
                        <span>0{index + 1}</span><span>{step.time}</span>
                      </div>
                      <div className="mt-1 text-sm font-black">{step.title}</div>
                      <div className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{step.text}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-secondary)] px-3 py-2"><CheckCircle2 className="h-3.5 w-3.5 text-[var(--success)]" />Без регистрации</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-secondary)] px-3 py-2"><FileCheck2 className="h-3.5 w-3.5 text-[var(--success)]" />Данные сбрасываются</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-secondary)] px-3 py-2"><ShieldCheck className="h-3.5 w-3.5 text-[var(--success)]" />Без реальных оплат</span>
            </div>
          </div>
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}

