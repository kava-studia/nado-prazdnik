import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wine, 
  Save, 
  ClipboardList, 
  ChevronRight, 
  ChevronLeft
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';
import ConfirmDialog from '../components/ConfirmDialog';
import { 
  NumberStepper, 
  FormField, 
  ProgressSteps 
} from '../components/UI';
import { DrinkConfig, EventProject } from '../types';
import { getActiveProject, saveProject } from '../services/eventlyStorage';

export default function DrinksCalculator() {
  const navigate = useNavigate();

  // Active Wizard Step (1: Guests, 2: Event Details, 3: Drink selection)
  const [activeStep, setActiveStep] = useState(1);
  const [activeProject, setActiveProject] = useState<EventProject | null>(null);

  // Guest inputs
  const [menCount, setMenCount] = useState<number>(20);
  const [womenCount, setWomenCount] = useState<number>(20);
  const [childrenCount, setChildrenCount] = useState<number>(5);
  const [nonDrinkersCount, setNonDrinkersCount] = useState<number>(5);
  
  // Computed total guests
  const guestsCount = menCount + womenCount + childrenCount + nonDrinkersCount;

  // Event parameters
  const [durationHours, setDurationHours] = useState<number>(6);
  const [season, setSeason] = useState<'summer' | 'winter' | 'autumn_spring'>('summer');
  const [activityLevel, setActivityLevel] = useState<'high' | 'medium' | 'low'>('medium');

  // Cork fee inputs
  const [corkFeePerBottle, setCorkFeePerBottle] = useState<number>(300);

  // Available Drinks List configuration with realistic prices
  const [drinks, setDrinks] = useState<DrinkConfig[]>([
    { id: 'vodka', name: 'Водка', category: 'strong', unit: '0.5 л', approxPrice: 800, enabled: true },
    { id: 'whiskey', name: 'Виски', category: 'strong', unit: '0.7 л', approxPrice: 2500, enabled: true },
    { id: 'cognac', name: 'Коньяк', category: 'strong', unit: '0.7 л', approxPrice: 3000, enabled: false },
    { id: 'rum', name: 'Ром', category: 'strong', unit: '0.7 л', approxPrice: 1800, enabled: false },
    { id: 'gin', name: 'Джин', category: 'strong', unit: '0.7 л', approxPrice: 2200, enabled: false },
    { id: 'tequila', name: 'Текила', category: 'strong', unit: '0.7 л', approxPrice: 2400, enabled: false },
    { id: 'red_wine', name: 'Красное вино', category: 'wine', unit: '0.75 л', approxPrice: 1200, enabled: true },
    { id: 'white_wine', name: 'Белое вино', category: 'wine', unit: '0.75 л', approxPrice: 1200, enabled: true },
    { id: 'sparkling', name: 'Игристое вино', category: 'wine', unit: '0.75 л', approxPrice: 1500, enabled: true },
    { id: 'beer', name: 'Пиво', category: 'beer', unit: '0.5 л', approxPrice: 250, enabled: false },
    { id: 'water', name: 'Вода (с газом / без)', category: 'soft', unit: '1.0 л', approxPrice: 120, enabled: true },
    { id: 'juice', name: 'Соки в ассортименте', category: 'soft', unit: '1.0 л', approxPrice: 160, enabled: true },
    { id: 'soda', name: 'Газированные напитки', category: 'soft', unit: '1.0 л', approxPrice: 130, enabled: true },
    { id: 'tonic', name: 'Тоник / Кола', category: 'soft', unit: '1.0 л', approxPrice: 130, enabled: false },
    { id: 'coffee', name: 'Кофе', category: 'hot', unit: 'порц.', approxPrice: 150, enabled: true },
    { id: 'tea', name: 'Чай листовой', category: 'hot', unit: 'порц.', approxPrice: 120, enabled: true }
  ]);

  // Calculated Results
  const [calculatedItems, setCalculatedItems] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalPrice: 0,
    totalWithCork: 0,
    corkFeeTotal: 0,
    costPerGuest: 0,
    totalLiters: 0,
    totalBottles: 0,
    alcoholBottles: 0
  });

  const [isSavedDialogOpen, setIsSavedDialogOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);

  // Load from active project on mount
  useEffect(() => {
    const proj = getActiveProject();
    if (proj) {
      setActiveProject(proj);
      const gc = proj.guestsCount || 40;
      // Distribute naturally if not split
      setMenCount(Math.round(gc * 0.4));
      setWomenCount(Math.round(gc * 0.4));
      setNonDrinkersCount(Math.round(gc * 0.1));
      setChildrenCount(Math.round(gc * 0.1));
      
      if (proj.drinksCalculation) {
        const savedCalc = proj.drinksCalculation;
        if (savedCalc.savedDrinksList && Array.isArray(savedCalc.savedDrinksList)) {
          // Merge active flags back to base list
          const updatedDrinks = drinks.map(d => {
            const savedItem = savedCalc.savedDrinksList.find((item: any) => item.id === d.id);
            if (savedItem) {
              return { ...d, enabled: true, approxPrice: (savedItem as any).approxPrice || d.approxPrice };
            }
            return { ...d, enabled: false };
          });
          setDrinks(updatedDrinks);
        }
      }
    }
  }, []);

  // Main alcohol and soft drinks calculation logic
  const performCalculation = () => {
    const drinkingGuestsCount = Math.max(0, guestsCount - childrenCount - nonDrinkersCount);
    if (guestsCount <= 0) return;

    let multiplierSeason = 1.0;
    if (season === 'summer') multiplierSeason = 1.15;
    if (season === 'winter') multiplierSeason = 0.95;

    let multiplierActivity = 1.0;
    if (activityLevel === 'high') multiplierActivity = 1.2;
    if (activityLevel === 'low') multiplierActivity = 0.8;

    const durationFactor = durationHours / 6.0; // Normalized around 6 hours

    const newCalculated = drinks.map((drink) => {
      if (!drink.enabled) {
        return { ...drink, bottles: 0, liters: 0, priceTotal: 0 };
      }

      let litersNeeded = 0;

      if (drink.category === 'strong') {
        const baseStrongLiters = 0.25; // 250 ml strong alcohol per drinking adult
        const enabledStrongCount = drinks.filter((d) => d.category === 'strong' && d.enabled).length;
        const share = enabledStrongCount > 0 ? 1 / enabledStrongCount : 0;

        litersNeeded = drinkingGuestsCount * baseStrongLiters * share * multiplierActivity * durationFactor;
        if (season === 'winter') litersNeeded *= 1.1;
      } else if (drink.category === 'wine') {
        const baseWineLiters = 0.4; // 400 ml of wine/sparkling per drinking adult
        const enabledWineCount = drinks.filter((d) => d.category === 'wine' && d.enabled).length;
        const share = enabledWineCount > 0 ? 1 / enabledWineCount : 0;

        litersNeeded = drinkingGuestsCount * baseWineLiters * share * multiplierSeason * durationFactor;
        if (season === 'summer') litersNeeded *= 1.15;
      } else if (drink.category === 'beer') {
        const baseBeerLiters = 0.6;
        litersNeeded = drinkingGuestsCount * baseBeerLiters * durationFactor;
      } else if (drink.category === 'soft') {
        if (drink.id === 'water') {
          const baseWater = season === 'summer' ? 1.2 : 0.8;
          litersNeeded = guestsCount * baseWater * durationFactor;
        } else if (drink.id === 'juice') {
          litersNeeded = guestsCount * 0.5 * durationFactor;
        } else {
          litersNeeded = guestsCount * 0.4 * durationFactor;
        }
      } else if (drink.category === 'hot') {
        litersNeeded = guestsCount * 0.2;
      }

      const reserveFactor = 1.15; // Recommended safety margin of +15%
      const totalLitersWithReserve = litersNeeded * reserveFactor;

      let bottles = 0;
      if (drink.category === 'hot') {
        bottles = Math.ceil(totalLitersWithReserve / 0.15); // portions of 150ml
      } else {
        const botSize = drink.id === 'vodka' || drink.id === 'beer' ? 0.5 : drink.id === 'water' || drink.id === 'juice' || drink.id === 'soda' || drink.id === 'tonic' ? 1.0 : 0.7;
        bottles = Math.ceil(totalLitersWithReserve / botSize);
      }

      if (bottles === 0 && drink.enabled) {
        bottles = 2; // Minimum safety buffer
      }

      const calculatedLiters = drink.category === 'hot' ? bottles * 0.15 : bottles * (drink.id === 'vodka' || drink.id === 'beer' ? 0.5 : drink.id === 'water' || drink.id === 'juice' || drink.id === 'soda' || drink.id === 'tonic' ? 1.0 : 0.7);
      const priceTotal = bottles * drink.approxPrice;

      return {
        ...drink,
        bottles,
        liters: calculatedLiters,
        priceTotal
      };
    }).filter(item => item.enabled);

    const totalPrice = newCalculated.reduce((sum, item) => sum + item.priceTotal, 0);

    // Cork fee for alcohol
    const alcoholTypes = ['strong', 'wine'];
    const totalAlcoholBottles = newCalculated
      .filter((item) => alcoholTypes.includes(item.category))
      .reduce((sum, item) => sum + item.bottles, 0);

    const corkFeeTotal = totalAlcoholBottles * corkFeePerBottle;
    const totalWithCork = totalPrice + corkFeeTotal;

    const totalBottles = newCalculated.reduce((sum, item) => sum + item.bottles, 0);
    const totalLiters = newCalculated.reduce((sum, item) => sum + item.liters, 0);

    setCalculatedItems(newCalculated);
    setMetrics({
      totalPrice,
      totalWithCork,
      corkFeeTotal,
      costPerGuest: Math.round(totalWithCork / guestsCount),
      totalLiters,
      totalBottles,
      alcoholBottles: totalAlcoholBottles
    });
  };

  useEffect(() => {
    performCalculation();
  }, [
    guestsCount,
    menCount,
    womenCount,
    childrenCount,
    nonDrinkersCount,
    durationHours,
    season,
    activityLevel,
    corkFeePerBottle,
    drinks
  ]);

  const handleToggleDrink = (id: string) => {
    const updated = drinks.map((drink) => {
      if (drink.id === id) {
        return { ...drink, enabled: !drink.enabled };
      }
      return drink;
    });
    setDrinks(updated);
  };

  const handlePriceChange = (id: string, price: number) => {
    const updated = drinks.map((drink) => {
      if (drink.id === id) {
        return { ...drink, approxPrice: Math.max(0, price) };
      }
      return drink;
    });
    setDrinks(updated);
  };

  const handleSaveToProject = () => {
    // Save to legacy keys
    localStorage.setItem('kava_saved_drinks_list', JSON.stringify(calculatedItems));
    localStorage.setItem('kava_saved_drinks_metrics', JSON.stringify(metrics));

    // Save into active project structure
    if (activeProject) {
      const updatedProject: EventProject = {
        ...activeProject,
        drinksCalculation: {
          totalPrice: metrics.totalPrice,
          corkFeeTotal: metrics.corkFeeTotal,
          totalWithCork: metrics.totalWithCork,
          savedDrinksList: calculatedItems.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            bottles: item.bottles,
            liters: item.liters
          }))
        }
      };
      saveProject(updatedProject);
    }

    setIsSavedDialogOpen(true);
  };

  const handleNextStep = () => {
    if (activeStep < 3) {
      setActiveStep(activeStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  return (
    <div className="min-h-screen pb-32 flex flex-col justify-between font-sans text-[var(--color-text)] animate-fade-in" id="drinks-calculator-view">
      <AppHeader title="Калькулятор напитков" />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10 text-left">
        <div className="max-w-2xl mx-auto space-y-8">
          
          {/* Page Intro Header */}
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-[var(--color-text)] tracking-tight leading-tight">
              Расчет закупки напитков NADO ПРАЗДНИК
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Укажите параметры события, состав гостей и предпочтения в баре, чтобы рассчитать точную смету закупки алкогольных и безалкогольных напитков с учетом пробкового сбора.
            </p>
          </div>

          {/* Dynamic 3-Step Wizard Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
              <span>Шаг {activeStep} из 3: {
                activeStep === 1 ? 'Состав гостей' :
                activeStep === 2 ? 'Параметры и формат' : 'Ассортимент бара'
              }</span>
              <span>Итого гостей: {guestsCount}</span>
            </div>
            <ProgressSteps totalSteps={3} currentStep={activeStep} />
          </div>

          {/* STEP 1: GUEST CONTEXT */}
          {activeStep === 1 && (
            <div className="space-y-6 animate-fade-in" id="step-1-guests">
              <div className="premium-glass-card rounded-[24px] p-6 space-y-5 shadow-sm">
                <h3 className="text-base font-black text-[var(--color-text)] tracking-tight border-b border-[var(--color-border)] pb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[var(--color-champagne)] flex items-center justify-center text-[var(--color-gold-deep)] text-xs font-bold font-mono border border-[var(--color-gold)]/10">1</span>
                  Категории гостей и их предпочтения
                </h3>
                
                <div className="space-y-4">
                  <NumberStepper
                    label="Мужчины (пьющие алкоголь)"
                    value={menCount}
                    onChange={(val) => setMenCount(val)}
                    min={0}
                    max={500}
                  />
                  <NumberStepper
                    label="Женщины (пьющие алкоголь)"
                    value={womenCount}
                    onChange={(val) => setWomenCount(val)}
                    min={0}
                    max={500}
                  />
                  <NumberStepper
                    label="Непьющие взрослые"
                    value={nonDrinkersCount}
                    onChange={(val) => setNonDrinkersCount(val)}
                    min={0}
                    max={500}
                  />
                  <NumberStepper
                    label="Дети и подростки (до 18 лет)"
                    value={childrenCount}
                    onChange={(val) => setChildrenCount(val)}
                    min={0}
                    max={500}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  onClick={handleNextStep} 
                  className="px-6 py-3 premium-gold-button font-black text-xs uppercase tracking-wider flex items-center gap-1.5"
                >
                  Продолжить <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: EVENT SETTINGS */}
          {activeStep === 2 && (
            <div className="space-y-6 animate-fade-in" id="step-2-details">
              <div className="premium-glass-card rounded-[24px] p-6 space-y-6 shadow-sm">
                <h3 className="text-base font-black text-[var(--color-text)] tracking-tight border-b border-[var(--color-border)] pb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[var(--color-champagne)] flex items-center justify-center text-[var(--color-gold-deep)] text-xs font-bold font-mono border border-[var(--color-gold)]/10">2</span>
                  Параметры и формат мероприятия
                </h3>

                {/* Duration Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <label className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                      Длительность банкета
                    </label>
                    <span className="text-base font-black text-[var(--color-text)] font-mono">{durationHours} часов</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="14"
                    step="1"
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full h-1.5 rounded-lg bg-[var(--color-border)] accent-[var(--color-gold-deep)] appearance-none cursor-pointer"
                  />
                </div>

                {/* Season Buttons */}
                <div className="space-y-3 pt-3 border-t border-[var(--color-border)]">
                  <label className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block">
                    Сезон проведения
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(['summer', 'winter', 'autumn_spring'] as const).map((s) => {
                      const label = s === 'summer' ? 'Лето' : s === 'winter' ? 'Зима' : 'Межсезонье';
                      const emoji = s === 'summer' ? '☀️' : s === 'winter' ? '❄️' : '🍂';
                      const isSelected = season === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSeason(s)}
                          className={`py-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[var(--color-champagne)] border-[var(--color-gold)]/30 text-[var(--color-text)] shadow-sm'
                              : 'bg-white border-[var(--color-border)] hover:border-[var(--color-gold)]/20 text-[var(--color-text-secondary)]'
                          }`}
                        >
                          <span className="text-base">{emoji}</span>
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Activity Level Buttons */}
                <div className="space-y-3 pt-3 border-t border-[var(--color-border)]">
                  <label className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block">
                    Уровень активности и танцевальность гостей
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(['high', 'medium', 'low'] as const).map((act) => {
                      const label = act === 'high' ? 'Высокий' : act === 'medium' ? 'Умеренный' : 'Низкий';
                      const desc = act === 'high' ? 'Активные танцы' : act === 'medium' ? 'Стандартный' : 'Спокойный';
                      const isSelected = activityLevel === act;
                      return (
                        <button
                          key={act}
                          type="button"
                          onClick={() => setActivityLevel(act)}
                          className={`py-3 rounded-xl text-xs font-bold flex flex-col items-center border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[var(--color-champagne)] border-[var(--color-gold)]/30 text-[var(--color-text)] shadow-sm'
                              : 'bg-white border-[var(--color-border)] hover:border-[var(--color-gold)]/20 text-[var(--color-text-secondary)]'
                          }`}
                        >
                          <span>{label}</span>
                          <span className="text-xs font-bold text-[var(--color-text-secondary)] mt-0.5">{desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cork Fee Pricing Input */}
                <div className="pt-4 border-t border-[var(--color-border)]">
                  <FormField
                    label="Пробковый сбор площадки за 1 бутылку (₽)"
                    type="number"
                    min="0"
                    value={corkFeePerBottle}
                    onChange={(e) => setCorkFeePerBottle(Math.max(0, Number(e.target.value)))}
                    id="cork-fee-input"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button 
                  onClick={handlePrevStep} 
                  className="px-5 py-3 bg-white border border-[var(--color-border)] hover:bg-[var(--color-surface-raised)] text-[var(--color-text)] text-xs font-bold rounded-xl cursor-pointer shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" /> Назад
                </button>
                
                <button 
                  onClick={handleNextStep} 
                  className="px-6 py-3 premium-gold-button font-black text-xs uppercase tracking-wider flex items-center gap-1.5"
                >
                  Продолжить <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: DRINK OPTIONS & LIVE CALCULATION REPORT */}
          {activeStep === 3 && (
            <div className="space-y-6 animate-fade-in" id="step-3-drinks">
              
              {/* Checklist panel */}
              <div className="premium-glass-card rounded-[24px] p-6 space-y-5 shadow-sm">
                <div className="flex justify-between items-baseline border-b border-[var(--color-border)] pb-3">
                  <h3 className="text-base font-black text-[var(--color-text)] tracking-tight flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[var(--color-champagne)] flex items-center justify-center text-[var(--color-gold-deep)] text-xs font-bold font-mono border border-[var(--color-gold)]/10">3</span>
                    Содержимое барной карты
                  </h3>
                  <span className="text-xs text-[var(--color-text-secondary)] font-bold uppercase">Включить и настроить цену</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="drinks-config-list">
                  {drinks.map((drink) => (
                    <div
                      key={drink.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        drink.enabled
                          ? 'bg-white border-[var(--color-gold)]/20 shadow-sm'
                          : 'bg-white/40 border-[var(--color-border)] opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={drink.enabled}
                          onChange={() => handleToggleDrink(drink.id)}
                          className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-gold-deep)] focus:ring-[var(--color-gold)] accent-[var(--color-gold-deep)] cursor-pointer"
                          id={`toggle-${drink.id}`}
                        />
                        <div className="text-left">
                          <span className="text-xs font-bold text-[var(--color-text)] block leading-tight">{drink.name}</span>
                          <span className="text-xs text-[var(--color-text-secondary)] font-bold uppercase font-mono">{drink.unit}</span>
                        </div>
                      </div>

                      {drink.enabled && (
                        <div className="flex items-center gap-1 w-20 shrink-0">
                          <input
                            type="number"
                            value={drink.approxPrice}
                            onChange={(e) => handlePriceChange(drink.id, Number(e.target.value))}
                            className="w-full bg-[var(--color-background-soft)] border border-[var(--color-border)] rounded-lg p-1 text-xs text-right font-mono font-bold text-[var(--color-text)] focus:border-[var(--color-gold)] focus:outline-none"
                            title="Цена за бутылку"
                          />
                          <span className="text-xs text-[var(--color-text-secondary)]">₽</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* REPORT DISPLAY */}
              <div className="premium-glass-card rounded-[24px] p-6 space-y-5 shadow-sm relative overflow-hidden" id="calculator-results">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-gold-light)]/20 rounded-bl-full pointer-events-none" />
                
                <div className="flex items-center gap-2.5 border-b border-[var(--color-border)] pb-3">
                  <Wine className="w-5 h-5 text-[var(--color-gold-deep)]" />
                  <h3 className="text-base font-black text-[var(--color-text)] tracking-tight">
                    Смета закупки и объемы
                  </h3>
                </div>

                <div className="space-y-3 font-sans">
                  {/* Table Header */}
                  <div className="flex justify-between items-center text-xs text-[var(--color-text-secondary)] uppercase tracking-wider font-bold pb-2 border-b border-[var(--color-border)]">
                    <span>Позиция</span>
                    <span className="text-right">Рекомендуемый объем</span>
                    <span className="text-right">Стоимость</span>
                  </div>

                  {/* Calculations breakdown list */}
                  <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1">
                    {calculatedItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-xs">
                        <div className="text-left">
                          <span className="text-[var(--color-text)] font-bold block">{item.name}</span>
                          <span className="text-xs text-[var(--color-text-secondary)]">{item.liters.toFixed(1)} литров всего</span>
                        </div>
                        <span className="font-mono text-[var(--color-text)] text-right font-bold shrink-0 px-4">
                          {item.bottles} бут.
                        </span>
                        <span className="font-mono text-[var(--color-gold-deep)] font-black text-right shrink-0">
                          {item.priceTotal.toLocaleString('ru-RU')} ₽
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Pricing summaries block */}
                  <div className="pt-4 border-t border-[var(--color-border)] space-y-2.5 text-xs font-sans">
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)]">Стоимость напитков:</span>
                      <span className="font-bold text-[var(--color-text)] font-mono">{metrics.totalPrice.toLocaleString('ru-RU')} ₽</span>
                    </div>
                    
                    {metrics.corkFeeTotal > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[var(--color-text-secondary)]">Пробковый сбор ({metrics.alcoholBottles} бут. алкоголя):</span>
                        <span className="font-bold text-[var(--color-text)] font-mono">{metrics.corkFeeTotal.toLocaleString('ru-RU')} ₽</span>
                      </div>
                    )}

                    <div className="flex justify-between pt-3.5 border-t border-[var(--color-border)] items-center">
                      <span className="font-black text-[var(--color-text)] uppercase text-xs tracking-wider">Общая закупка:</span>
                      <span className="text-xl font-black text-[var(--color-gold-deep)] font-mono">{metrics.totalWithCork.toLocaleString('ru-RU')} ₽</span>
                    </div>

                    <div className="flex justify-between text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface-raised)] p-3 rounded-xl mt-1.5 shadow-sm">
                      <span className="font-bold">Затраты на одного гостя:</span>
                      <span className="font-black text-[var(--color-text)] font-mono">{metrics.costPerGuest.toLocaleString('ru-RU')} ₽ / чел.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION FOOTER BUTTONS */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button 
                  onClick={handlePrevStep} 
                  className="py-3.5 bg-white border border-[var(--color-border)] hover:bg-[var(--color-surface-raised)] text-[var(--color-text)] text-xs font-bold rounded-xl cursor-pointer shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Вернуться
                </button>

                <button
                  onClick={() => setIsChecklistOpen(true)}
                  className="py-3.5 bg-[var(--color-champagne)] hover:bg-[var(--color-champagne)]/80 border border-[var(--color-gold)]/20 text-[var(--color-gold-deep)] text-xs font-bold rounded-xl cursor-pointer shadow-sm transition-colors flex items-center justify-center gap-1.5"
                  id="cta-generate-checklist"
                >
                  <ClipboardList className="w-4 h-4 mr-1.5" /> Список закупки
                </button>

                <button
                  onClick={handleSaveToProject}
                  className="flex-1 py-3.5 premium-gold-button font-black text-xs uppercase tracking-wider"
                  id="cta-save-drinks-to-project"
                >
                  <Save className="w-4 h-4 mr-1.5 inline" /> Сохранить в проект
                </button>
              </div>

            </div>
          )}

        </div>
      </main>

      <BottomNavigation />

      {/* Confirmation Save Dialog */}
      <ConfirmDialog
        isOpen={isSavedDialogOpen}
        title="Расчет успешно сохранен!"
        message="Параметры закупки алкогольных и безалкогольных напитков прикреплены к вашему проекту. Итоговые цифры обновлены в вашей смете проекта."
        confirmText="В панель проекта"
        cancelText="Остаться"
        type="success"
        onConfirm={() => {
          setIsSavedDialogOpen(false);
          navigate('/project');
        }}
        onCancel={() => setIsSavedDialogOpen(false)}
      />

      {/* Checklist PDF alert Dialog */}
      <ConfirmDialog
        isOpen={isChecklistOpen}
        title="Список закупки сформирован"
        message="Таблица закупки с указанием объема бутылок, рекомендуемого буфера и ориентировочных цен сформирована. Ссылка на скачивание реестра отправлена вашему банкетному менеджеру."
        confirmText="Прекрасно"
        cancelText="Назад"
        type="info"
        onConfirm={() => setIsChecklistOpen(false)}
        onCancel={() => setIsChecklistOpen(false)}
      />
    </div>
  );
}
