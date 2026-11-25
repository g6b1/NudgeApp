import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  Droplets,
  Gift,
  HelpCircle,
  Info,
  Leaf,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { GlassSheet } from '../ui/GlassSheet';
import { useNudge } from '../../context/NudgeContext';
import {
  COMPANION_MESSAGES,
  GARDEN_BACKGROUNDS,
  GARDEN_DECORATIONS,
  MAX_PLANT_XP,
  PLANT_SPECIES,
  POT_STYLES,
  WEEKLY_GARDEN_REWARDS,
  getStageForXp,
  resolveCurrentSeason,
} from '../../data/gardenCatalog';
import {
  DecorationIllustration,
  FrogCompanionSVG,
  PlantIllustration,
  SeasonalParticles,
} from './GardenIllustrations';
import { GardenSeasonId, PotStyleId } from '../../types/nudge';
import { getLocalWeekDates } from '../../utils/dateUtils';

interface TinyGardenModalProps {
  open: boolean;
  onClose: () => void;
  justDiscovered?: boolean;
}

type GardenTab = 'garden' | 'shop' | 'weekly' | 'guide';

export const TinyGardenModal: React.FC<TinyGardenModalProps> = ({
  open,
  onClose,
  justDiscovered = false,
}) => {
  const {
    state,
    todayKey,
    markGardenVisited,
    unlockGardenSpecies,
    plantSeedInSlot,
    unlockGardenDecoration,
    placeDecorationInSlot,
    unlockGardenBackground,
    moveGardenSlot,
    clearGardenSlot,
    waterPlantSlot,
    nurturePlantWithEnergy,
    changePotStyle,
    updateGardenPreferences,
    claimWeeklyGardenReward,
  } = useNudge();

  const garden = state.garden;
  const [activeTab, setActiveTab] = useState<GardenTab>('garden');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(4);
  const [moveMode, setMoveMode] = useState(false);
  const [moveFromIndex, setMoveFromIndex] = useState<number | null>(null);
  const [emptyPickerTab, setEmptyPickerTab] = useState<'seeds' | 'decorations'>('seeds');
  const [selectedPotStyle, setSelectedPotStyle] = useState<PotStyleId>('terracotta');
  const [waterSplashSlot, setWaterSplashSlot] = useState<number | null>(null);
  const [confirmClearSlot, setConfirmClearSlot] = useState<number | null>(null);
  const [companionMsgIdx, setCompanionMsgIdx] = useState(0);
  const [companionReaction, setCompanionReaction] = useState<string | null>(null);
  const [frogHopped, setFrogHopped] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [discoveryDismissed, setDiscoveryDismissed] = useState(false);

  // Snapshot unseen summary when modal opens so user sees what grew while closed
  const [welcomeSummary, setWelcomeSummary] = useState<{
    actions: number;
    energy: number;
    levelUps: string[];
  } | null>(null);

  useEffect(() => {
    if (open) {
      setBannerDismissed(false);
      setDiscoveryDismissed(false);
      setCompanionReaction(null);
      setConfirmClearSlot(null);
      setMoveMode(false);
      setMoveFromIndex(null);
      if (
        garden.unseenActionCount > 0 ||
        garden.unseenEnergyEarned > 0 ||
        garden.unseenLevelUps.length > 0
      ) {
        setWelcomeSummary({
          actions: garden.unseenActionCount,
          energy: garden.unseenEnergyEarned,
          levelUps: garden.unseenLevelUps,
        });
      } else {
        setWelcomeSummary(null);
      }
      // Pick a pleasant initial companion message
      setCompanionMsgIdx(Math.floor(Math.random() * COMPANION_MESSAGES.length));
    }
  }, [open]);

  const triggerCompanionReaction = (message: string) => {
    setCompanionReaction(message);
    setFrogHopped(true);
    window.setTimeout(() => setFrogHopped(false), 380);
  };

  const handleClose = () => {
    markGardenVisited();
    onClose();
  };

  const activeBg = useMemo(
    () => GARDEN_BACKGROUNDS.find((b) => b.id === garden.activeBackground) || GARDEN_BACKGROUNDS[0],
    [garden.activeBackground]
  );

  const resolvedSeason = useMemo(
    () => resolveCurrentSeason(garden.seasonOverride),
    [garden.seasonOverride]
  );

  const weekDates = useMemo(() => getLocalWeekDates(todayKey), [todayKey]);
  const weekKey = weekDates[0];
  const weeklyActionsCount = useMemo(() => {
    const dateSet = new Set(weekDates);
    return state.completionLog.filter((r) => dateSet.has(r.date)).length;
  }, [state.completionLog, weekDates]);

  const handleTileClick = (idx: number) => {
    setConfirmClearSlot(null);
    if (moveMode) {
      if (moveFromIndex === null) {
        if (garden.slots[idx] !== null) {
          setMoveFromIndex(idx);
          setSelectedSlot(idx);
        }
      } else {
        moveGardenSlot(moveFromIndex, idx);
        setSelectedSlot(idx);
        setMoveFromIndex(null);
        setMoveMode(false);
      }
      return;
    }
    setSelectedSlot(idx);
  };

  const handleWater = (slotIdx: number) => {
    const ok = waterPlantSlot(slotIdx);
    if (ok) {
      setWaterSplashSlot(slotIdx);
      window.setTimeout(() => {
        setWaterSplashSlot((prev) => (prev === slotIdx ? null : prev));
      }, 900);
    }
  };

  const handleTapFrog = () => {
    setFrogHopped(true);
    setCompanionReaction(null);
    setCompanionMsgIdx((prev) => (prev + 1) % COMPANION_MESSAGES.length);
    window.setTimeout(() => setFrogHopped(false), 380);
  };

  const selectedContent = selectedSlot !== null ? garden.slots[selectedSlot] : null;

  return (
    <GlassSheet
      open={open}
      onClose={handleClose}
      title="Tiny Garden"
      subtitle="A peaceful little corner nurtured naturally by your real-life positive actions"
      maxWidthClass="max-w-4xl"
    >
      <div className="space-y-5">
        {/* Top Bar: Energy Readout & Sub-Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/5 dark:bg-white/5 overflow-x-auto max-w-full">
            {(
              [
                { id: 'garden', label: 'Garden', icon: Leaf },
                { id: 'shop', label: 'Nursery & Decor', icon: ShoppingBag },
                { id: 'weekly', label: 'Weekly Gifts', icon: Gift },
                { id: 'guide', label: 'How It Works', icon: HelpCircle },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`min-h-[38px] px-3.5 rounded-xl text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? 'bg-[var(--nudge-accent)] text-[var(--nudge-accent-ink)]'
                      : 'text-[var(--nudge-muted)] hover:text-[var(--nudge-ink)]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl glass-panel shrink-0">
            <Sparkles className="w-4 h-4" style={{ color: 'var(--nudge-accent)' }} />
            <span className="font-mono-num text-sm font-semibold text-[var(--nudge-ink)]">
              {garden.energy}
            </span>
            <span className="text-xs text-[var(--nudge-muted)] whitespace-nowrap">
              Garden Energy
            </span>
          </div>
        </div>

        {/* First-time Easter egg discovery note */}
        {justDiscovered && !discoveryDismissed && (
          <div className="rounded-2xl p-4 border border-[var(--nudge-accent)]/40 bg-[var(--nudge-accent-soft)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="font-display text-sm md:text-base font-medium text-[var(--nudge-ink)]">
                You found your Tiny Garden!
              </p>
              <p className="text-xs text-[var(--nudge-muted)] leading-relaxed">
                This quiet corner grows automatically whenever you complete positive actions in Nudge. You can also revisit it anytime from Progress or Settings.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDiscoveryDismissed(true)}
              className="min-h-[38px] px-3.5 rounded-xl glass-panel text-xs font-medium whitespace-nowrap shrink-0 self-start sm:self-center"
            >
              Wonderful
            </button>
          </div>
        )}

        {/* Passive Growth Summary Banner (when actions accumulated while away) */}
        {welcomeSummary && !bannerDismissed && (
          <div className="rounded-2xl p-4 border border-[var(--nudge-accent)]/35 bg-[var(--nudge-accent-soft)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="font-display text-sm md:text-base font-medium text-[var(--nudge-ink)]">
                Your garden has been growing.
              </p>
              <p className="text-xs text-[var(--nudge-muted)]">
                {welcomeSummary.actions > 0
                  ? `You nurtured your garden with ${welcomeSummary.actions} positive ${
                      welcomeSummary.actions === 1 ? 'action' : 'actions'
                    } (+${welcomeSummary.energy} Garden Energy).`
                  : `You earned +${welcomeSummary.energy} Garden Energy from your reflections.`}
              </p>
              {welcomeSummary.levelUps.length > 0 && (
                <p className="text-xs font-medium text-[var(--nudge-ink)]">
                  {welcomeSummary.levelUps.join(' • ')}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setBannerDismissed(true);
                markGardenVisited();
              }}
              className="min-h-[38px] px-3.5 rounded-xl glass-panel text-xs font-medium whitespace-nowrap shrink-0 self-start sm:self-center"
            >
              Lovely
            </button>
          </div>
        )}

        {/* TAB 1: GARDEN CANVAS */}
        {activeTab === 'garden' && (
          <div className="space-y-4">
            {/* Garden Controls Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMoveMode((prev) => !prev);
                    setMoveFromIndex(null);
                  }}
                  className={`min-h-[38px] px-3 rounded-xl text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                    moveMode
                      ? 'bg-[var(--nudge-accent)] text-[var(--nudge-accent-ink)]'
                      : 'glass-panel text-[var(--nudge-ink)]'
                  }`}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>
                    {moveMode
                      ? moveFromIndex === null
                        ? 'Select item to move'
                        : 'Tap destination tile'
                      : 'Rearrange'}
                  </span>
                </button>

                <select
                  aria-label="Garden backdrop"
                  value={garden.activeBackground}
                  onChange={(e) =>
                    updateGardenPreferences({
                      activeBackground: e.target.value as typeof garden.activeBackground,
                    })
                  }
                  className="min-h-[38px] px-3 rounded-xl glass-panel text-xs font-medium text-[var(--nudge-ink)] bg-transparent"
                >
                  {GARDEN_BACKGROUNDS.filter((b) => garden.unlockedBackgrounds.includes(b.id)).map(
                    (bg) => (
                      <option key={bg.id} value={bg.id} className="text-slate-900">
                        {bg.name}
                      </option>
                    )
                  )}
                </select>

                <select
                  aria-label="Garden season"
                  value={garden.seasonOverride}
                  onChange={(e) =>
                    updateGardenPreferences({ seasonOverride: e.target.value as GardenSeasonId })
                  }
                  className="min-h-[38px] px-3 rounded-xl glass-panel text-xs font-medium text-[var(--nudge-ink)] bg-transparent"
                >
                  <option value="auto" className="text-slate-900">
                    Season: Auto ({resolvedSeason})
                  </option>
                  <option value="spring" className="text-slate-900">
                    Spring
                  </option>
                  <option value="summer" className="text-slate-900">
                    Summer
                  </option>
                  <option value="autumn" className="text-slate-900">
                    Autumn
                  </option>
                  <option value="winter" className="text-slate-900">
                    Winter
                  </option>
                </select>
              </div>

              <label className="min-h-[38px] px-3 rounded-xl glass-panel text-xs flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={garden.companionVisible}
                  onChange={(e) =>
                    updateGardenPreferences({ companionVisible: e.target.checked })
                  }
                />
                <span>Show {garden.companionName}</span>
              </label>
            </div>

            {/* Illustrated Garden Scene + 12-Tile Grid */}
            <div
              className={`relative rounded-3xl overflow-hidden border border-[var(--nudge-glass-border)] p-3 sm:p-5 transition-colors duration-300 ${
                activeBg.isDark ? 'text-stone-100' : 'text-[var(--nudge-ink)]'
              }`}
              style={{
                background: `linear-gradient(180deg, ${activeBg.skyTop} 0%, ${activeBg.skyBottom} 34%, ${activeBg.groundTop} 35%, ${activeBg.groundBottom} 100%)`,
              }}
            >
              {/* Atmospheric sky detail */}
              {activeBg.isDark && (
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-60">
                  <span className="absolute left-[14%] top-4 w-1 h-1 rounded-full bg-amber-100" />
                  <span className="absolute left-[31%] top-8 w-1.5 h-1.5 rounded-full bg-amber-100" />
                  <span className="absolute left-[62%] top-5 w-1 h-1 rounded-full bg-amber-100" />
                  <span className="absolute left-[83%] top-9 w-1.5 h-1.5 rounded-full bg-amber-100" />
                </div>
              )}

              <SeasonalParticles season={resolvedSeason} />

              {/* Companion Corner */}
              {garden.companionVisible && (
                <div className="relative z-10 flex items-center justify-between gap-3 mb-3">
                  <button
                    type="button"
                    onClick={handleTapFrog}
                    className="flex items-center gap-2.5 text-left group rounded-2xl px-2.5 py-1.5 bg-white/45 dark:bg-black/25 backdrop-blur-sm border border-white/30 dark:border-white/10 transition-colors hover:bg-white/60"
                  >
                    <FrogCompanionSVG hopped={frogHopped} className="w-11 h-11 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold opacity-80">
                        {garden.companionName} the Frog
                      </p>
                      <p className="text-xs leading-snug max-w-xs">
                        “{companionReaction ?? COMPANION_MESSAGES[companionMsgIdx]}”
                      </p>
                    </div>
                  </button>
                </div>
              )}

              {/* 12-Slot Garden Grid */}
              <div className="relative z-10 grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
                {garden.slots.map((slot, idx) => {
                  const isSelected = selectedSlot === idx;
                  const isMoveSource = moveFromIndex === idx;
                  const plantDef =
                    slot?.kind === 'plant'
                      ? PLANT_SPECIES.find((p) => p.id === slot.speciesId)
                      : null;
                  const stageInfo =
                    slot?.kind === 'plant' ? getStageForXp(slot.growthXp) : null;
                  const decoDef =
                    slot?.kind === 'decoration'
                      ? GARDEN_DECORATIONS.find((d) => d.id === slot.decorationId)
                      : null;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleTileClick(idx)}
                      className={`relative min-h-[116px] sm:min-h-[132px] rounded-2xl p-2 flex flex-col items-center justify-between transition-all ${
                        isMoveSource
                          ? 'ring-2 ring-amber-400 bg-white/55 dark:bg-black/35 scale-[1.02]'
                          : isSelected
                          ? 'ring-2 ring-[var(--nudge-accent)] bg-white/55 dark:bg-black/35'
                          : slot
                          ? 'bg-white/30 dark:bg-black/20 hover:bg-white/45 dark:hover:bg-black/30'
                          : 'border border-dashed border-black/15 dark:border-white/20 bg-white/15 dark:bg-black/10 hover:bg-white/30'
                      }`}
                    >
                      {slot?.kind === 'plant' && plantDef && stageInfo ? (
                        <>
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                            <PlantIllustration
                              speciesId={slot.speciesId}
                              potStyle={slot.potStyle}
                              stage={stageInfo.stage}
                              wateredRecently={
                                waterSplashSlot === idx || slot.lastWateredDate === todayKey
                              }
                            />
                            {waterSplashSlot === idx && (
                              <span className="absolute -top-1 right-0 text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-sky-500/85 text-white">
                                +💧
                              </span>
                            )}
                          </div>
                          <div className="w-full text-center space-y-1">
                            <p className="text-[11px] font-semibold truncate">
                              {plantDef.name}
                            </p>
                            <div className="w-full h-1.5 rounded-full bg-black/10 dark:bg-white/15 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.round((slot.growthXp / MAX_PLANT_XP) * 100)
                                  )}%`,
                                  backgroundColor: 'var(--nudge-accent)',
                                }}
                              />
                            </div>
                          </div>
                        </>
                      ) : slot?.kind === 'decoration' && decoDef ? (
                        <>
                          <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                            <DecorationIllustration
                              decorationId={slot.decorationId}
                              isDarkBg={Boolean(activeBg.isDark)}
                            />
                          </div>
                          <p className="text-[11px] font-medium truncate w-full text-center">
                            {decoDef.name}
                          </p>
                        </>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center gap-1 opacity-65">
                          <Plus className="w-4 h-4" />
                          <span className="text-[11px] font-medium">Empty Spot</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Tile Inspector / Action Panel */}
            {selectedSlot !== null && (
              <div className="glass-panel rounded-2xl p-4 sm:p-5 space-y-4">
                {selectedContent?.kind === 'plant' ? (
                  (() => {
                    const def =
                      PLANT_SPECIES.find((p) => p.id === selectedContent.speciesId) ||
                      PLANT_SPECIES[0];
                    const stage = getStageForXp(selectedContent.growthXp);
                    const isMax = selectedContent.growthXp >= MAX_PLANT_XP;
                    const wateredToday = selectedContent.lastWateredDate === todayKey;

                    return (
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-display text-lg font-medium text-[var(--nudge-ink)]">
                                {def.name}
                              </h3>
                              <span className="text-xs font-medium text-[var(--nudge-muted)]">
                                Stage {stage.stage}/6 · {stage.name}
                              </span>
                            </div>
                            <p className="text-xs text-[var(--nudge-muted)] mt-0.5">
                              {def.bloomNote}
                            </p>
                          </div>

                          <div className="text-xs font-mono-num text-[var(--nudge-muted)] shrink-0">
                            {selectedContent.growthXp} / {MAX_PLANT_XP} Growth
                          </div>
                        </div>

                        {/* Actions Row */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleWater(selectedSlot)}
                            className="tactile-btn min-h-[40px] px-3.5 rounded-xl glass-panel text-xs font-medium flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <Droplets className="w-3.5 h-3.5 text-sky-500" />
                            <span>
                              {wateredToday
                                ? 'Watered Today (Splash Again)'
                                : 'Water Plant (Optional)'}
                            </span>
                          </button>

                          {!isMax && (
                            <button
                              type="button"
                              disabled={garden.energy < 1}
                              onClick={() => nurturePlantWithEnergy(selectedSlot)}
                              className="tactile-btn min-h-[40px] px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap disabled:opacity-45"
                              style={{
                                backgroundColor: 'var(--nudge-accent)',
                                color: 'var(--nudge-accent-ink)',
                              }}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Nurture (+1 Growth · 1 Energy)</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setMoveMode(true);
                              setMoveFromIndex(selectedSlot);
                            }}
                            className="min-h-[40px] px-3.5 rounded-xl glass-panel text-xs font-medium flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                            <span>Move Pot</span>
                          </button>

                          {confirmClearSlot === selectedSlot ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  clearGardenSlot(selectedSlot);
                                  setConfirmClearSlot(null);
                                }}
                                className="min-h-[40px] px-3 rounded-xl bg-rose-600 text-white text-xs font-semibold whitespace-nowrap"
                              >
                                Confirm Remove
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmClearSlot(null)}
                                className="min-h-[40px] px-2.5 rounded-xl glass-panel text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmClearSlot(selectedSlot)}
                              className="min-h-[40px] px-3 rounded-xl glass-panel text-xs text-[var(--nudge-muted)] hover:text-rose-600 flex items-center gap-1.5 whitespace-nowrap"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Clear Spot</span>
                            </button>
                          )}
                        </div>

                        {/* Pot Style Picker */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--nudge-glass-border)]">
                          <span className="text-xs text-[var(--nudge-muted)] mr-1">Pot Style:</span>
                          {POT_STYLES.map((pot) => (
                            <button
                              key={pot.id}
                              type="button"
                              onClick={() => changePotStyle(selectedSlot, pot.id)}
                              className={`min-h-[34px] px-3 rounded-xl text-xs font-medium flex items-center gap-1.5 whitespace-nowrap border transition-colors ${
                                selectedContent.potStyle === pot.id
                                  ? 'border-[var(--nudge-accent)] bg-[var(--nudge-accent-soft)] text-[var(--nudge-ink)]'
                                  : 'border-[var(--nudge-glass-border)] text-[var(--nudge-muted)]'
                              }`}
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full inline-block"
                                style={{ backgroundColor: pot.body }}
                              />
                              <span>{pot.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()
                ) : selectedContent?.kind === 'decoration' ? (
                  (() => {
                    const dec =
                      GARDEN_DECORATIONS.find((d) => d.id === selectedContent.decorationId) ||
                      GARDEN_DECORATIONS[0];
                    return (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h3 className="font-display text-base font-medium text-[var(--nudge-ink)]">
                            {dec.name}
                          </h3>
                          <p className="text-xs text-[var(--nudge-muted)] mt-0.5">{dec.note}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setMoveMode(true);
                              setMoveFromIndex(selectedSlot);
                            }}
                            className="min-h-[38px] px-3 rounded-xl glass-panel text-xs font-medium flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                            <span>Move</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => clearGardenSlot(selectedSlot)}
                            className="min-h-[38px] px-3 rounded-xl glass-panel text-xs font-medium text-[var(--nudge-muted)] hover:text-rose-600 whitespace-nowrap"
                          >
                            Put Away
                          </button>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  /* Empty Slot Picker */
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-display text-base font-medium text-[var(--nudge-ink)]">
                        Empty Garden Spot
                      </h3>
                      <div className="flex gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5">
                        <button
                          type="button"
                          onClick={() => setEmptyPickerTab('seeds')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                            emptyPickerTab === 'seeds'
                              ? 'bg-[var(--nudge-accent)] text-[var(--nudge-accent-ink)]'
                              : 'text-[var(--nudge-muted)]'
                          }`}
                        >
                          Plant Seed
                        </button>
                        <button
                          type="button"
                          onClick={() => setEmptyPickerTab('decorations')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                            emptyPickerTab === 'decorations'
                              ? 'bg-[var(--nudge-accent)] text-[var(--nudge-accent-ink)]'
                              : 'text-[var(--nudge-muted)]'
                          }`}
                        >
                          Place Decor
                        </button>
                      </div>
                    </div>

                    {emptyPickerTab === 'seeds' ? (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-[var(--nudge-muted)]">Pot:</span>
                          {POT_STYLES.map((pot) => (
                            <button
                              key={pot.id}
                              type="button"
                              onClick={() => setSelectedPotStyle(pot.id)}
                              className={`min-h-[32px] px-2.5 rounded-lg text-xs flex items-center gap-1.5 border ${
                                selectedPotStyle === pot.id
                                  ? 'border-[var(--nudge-accent)] bg-[var(--nudge-accent-soft)]'
                                  : 'border-[var(--nudge-glass-border)] text-[var(--nudge-muted)]'
                              }`}
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: pot.body }}
                              />
                              {pot.name}
                            </button>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                          {PLANT_SPECIES.filter((p) =>
                            garden.unlockedSpecies.includes(p.id)
                          ).map((sp) => {
                            const canAfford = garden.energy >= sp.seedCost;
                            return (
                              <button
                                key={sp.id}
                                type="button"
                                disabled={!canAfford}
                                onClick={() => {
                                  const planted = plantSeedInSlot(selectedSlot, sp.id, selectedPotStyle);
                                  if (planted) {
                                    triggerCompanionReaction(`Ooh, a new ${sp.name} seed! It will grow gently with you.`);
                                  }
                                }}
                                className="p-2.5 rounded-2xl glass-panel text-left flex flex-col items-center gap-1 hover:border-[var(--nudge-accent)] disabled:opacity-45 transition-colors"
                              >
                                <div className="w-12 h-12">
                                  <PlantIllustration
                                    speciesId={sp.id}
                                    potStyle={selectedPotStyle}
                                    stage={6}
                                  />
                                </div>
                                <span className="text-xs font-medium text-center truncate w-full">
                                  {sp.name}
                                </span>
                                <span className="text-[11px] font-mono-num text-[var(--nudge-muted)]">
                                  {sp.seedCost} Energy
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                        {GARDEN_DECORATIONS.filter((d) =>
                          garden.unlockedDecorations.includes(d.id)
                        ).map((dec) => (
                          <button
                            key={dec.id}
                            type="button"
                            onClick={() => placeDecorationInSlot(selectedSlot, dec.id)}
                            className="p-2.5 rounded-2xl glass-panel text-left flex flex-col items-center gap-1 hover:border-[var(--nudge-accent)] transition-colors"
                          >
                            <div className="w-12 h-12">
                              <DecorationIllustration decorationId={dec.id} />
                            </div>
                            <span className="text-xs font-medium text-center truncate w-full">
                              {dec.name}
                            </span>
                            <span className="text-[11px] text-[var(--nudge-muted)]">Place Free</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: NURSERY & DECOR SHOP */}
        {activeTab === 'shop' && (
          <div className="space-y-6">
            {/* Plant Species */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-medium">Plant Species</h3>
                <span className="text-xs text-[var(--nudge-muted)]">
                  {garden.unlockedSpecies.length} / {PLANT_SPECIES.length} unlocked
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PLANT_SPECIES.map((sp) => {
                  const unlocked = garden.unlockedSpecies.includes(sp.id);
                  const canAfford = garden.energy >= sp.unlockCost;
                  return (
                    <div
                      key={sp.id}
                      className="glass-panel rounded-2xl p-3.5 flex items-center gap-3"
                    >
                      <div className="w-14 h-14 shrink-0">
                        <PlantIllustration speciesId={sp.id} potStyle="terracotta" stage={6} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--nudge-ink)]">{sp.name}</p>
                        <p className="text-xs text-[var(--nudge-muted)] line-clamp-2">
                          {sp.bloomNote}
                        </p>
                        <p className="text-[11px] font-mono-num text-[var(--nudge-muted)] mt-1">
                          Seed cost: {sp.seedCost} Energy
                        </p>
                      </div>
                      {unlocked ? (
                        <span className="text-xs font-medium text-[var(--nudge-accent)] shrink-0">
                          Unlocked
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => {
                            const unlockedOk = unlockGardenSpecies(sp.id);
                            if (unlockedOk) {
                              triggerCompanionReaction(`Yay, ${sp.name} is unlocked! Ready whenever you'd like to plant it.`);
                            }
                          }}
                          className="min-h-[38px] px-3 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 disabled:opacity-45"
                          style={{
                            backgroundColor: 'var(--nudge-accent)',
                            color: 'var(--nudge-accent-ink)',
                          }}
                        >
                          Unlock · {sp.unlockCost}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Decorations */}
            <section className="space-y-3 pt-4 border-t border-[var(--nudge-glass-border)]">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-medium">Garden Decorations</h3>
                <span className="text-xs text-[var(--nudge-muted)]">
                  {garden.unlockedDecorations.length} / {GARDEN_DECORATIONS.length} unlocked
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GARDEN_DECORATIONS.map((dec) => {
                  const unlocked = garden.unlockedDecorations.includes(dec.id);
                  const canAfford = garden.energy >= dec.cost;
                  return (
                    <div
                      key={dec.id}
                      className="glass-panel rounded-2xl p-3.5 flex items-center gap-3"
                    >
                      <div className="w-14 h-14 shrink-0">
                        <DecorationIllustration decorationId={dec.id} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--nudge-ink)]">{dec.name}</p>
                        <p className="text-xs text-[var(--nudge-muted)]">{dec.note}</p>
                      </div>
                      {unlocked ? (
                        <span className="text-xs font-medium text-[var(--nudge-accent)] shrink-0">
                          Unlocked
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => {
                            const unlockedOk = unlockGardenDecoration(dec.id);
                            if (unlockedOk) {
                              triggerCompanionReaction(`${dec.name} looks so cozy for the garden!`);
                            }
                          }}
                          className="min-h-[38px] px-3 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 disabled:opacity-45"
                          style={{
                            backgroundColor: 'var(--nudge-accent)',
                            color: 'var(--nudge-accent-ink)',
                          }}
                        >
                          Unlock · {dec.cost}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Garden Backdrops */}
            <section className="space-y-3 pt-4 border-t border-[var(--nudge-glass-border)]">
              <h3 className="font-display text-base font-medium">Garden Backdrops</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GARDEN_BACKGROUNDS.map((bg) => {
                  const unlocked = garden.unlockedBackgrounds.includes(bg.id);
                  const isActive = garden.activeBackground === bg.id;
                  const canAfford = garden.energy >= bg.cost;
                  return (
                    <div
                      key={bg.id}
                      className="glass-panel rounded-2xl p-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-12 h-12 rounded-xl border border-black/10 shrink-0"
                          style={{
                            background: `linear-gradient(180deg, ${bg.skyTop} 0%, ${bg.groundBottom} 100%)`,
                          }}
                        />
                        <p className="text-sm font-semibold text-[var(--nudge-ink)] truncate">
                          {bg.name}
                        </p>
                      </div>
                      {isActive ? (
                        <span className="text-xs font-medium text-[var(--nudge-accent)] shrink-0">
                          Active
                        </span>
                      ) : unlocked ? (
                        <button
                          type="button"
                          onClick={() => updateGardenPreferences({ activeBackground: bg.id })}
                          className="min-h-[36px] px-3 rounded-xl glass-panel text-xs font-medium whitespace-nowrap shrink-0"
                        >
                          Use Backdrop
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => unlockGardenBackground(bg.id)}
                          className="min-h-[36px] px-3 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 disabled:opacity-45"
                          style={{
                            backgroundColor: 'var(--nudge-accent)',
                            color: 'var(--nudge-accent-ink)',
                          }}
                        >
                          Unlock · {bg.cost}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* TAB 3: WEEKLY REWARDS */}
        {activeTab === 'weekly' && (
          <div className="space-y-4">
            <div className="glass-panel rounded-2xl p-4 sm:p-5 space-y-1.5">
              <h3 className="font-display text-lg font-medium text-[var(--nudge-ink)]">
                You nurtured your garden with {weeklyActionsCount} positive{' '}
                {weeklyActionsCount === 1 ? 'action' : 'actions'} this week.
              </h3>
              <p className="text-xs text-[var(--nudge-muted)] leading-relaxed">
                Weekly Garden Gifts celebrate genuine actions you completed this week. Anything you unlock stays yours permanently—and quiet weeks never take anything away.
              </p>
            </div>

            <div className="space-y-3">
              {WEEKLY_GARDEN_REWARDS.map((reward) => {
                const claimed = (garden.claimedWeeklyRewards[weekKey] || []).includes(reward.id);
                const eligible = weeklyActionsCount >= reward.requiredActions;
                const progressPct = Math.min(
                  100,
                  Math.round((weeklyActionsCount / reward.requiredActions) * 100)
                );

                return (
                  <div
                    key={reward.id}
                    className="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[var(--nudge-ink)]">
                          {reward.title}
                        </p>
                        <span className="font-mono-num text-xs text-[var(--nudge-muted)]">
                          {Math.min(weeklyActionsCount, reward.requiredActions)} /{' '}
                          {reward.requiredActions} actions
                        </span>
                      </div>
                      <p className="text-xs text-[var(--nudge-muted)]">{reward.description}</p>
                      <div className="h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${progressPct}%`,
                            backgroundColor: 'var(--nudge-accent)',
                          }}
                        />
                      </div>
                    </div>

                    {claimed ? (
                      <span className="text-xs font-medium text-[var(--nudge-accent)] shrink-0">
                        Collected
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={!eligible}
                        onClick={() => claimWeeklyGardenReward(weekKey, reward.id)}
                        className="min-h-[40px] px-4 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 disabled:opacity-45"
                        style={{
                          backgroundColor: 'var(--nudge-accent)',
                          color: 'var(--nudge-accent-ink)',
                        }}
                      >
                        {eligible ? 'Collect Gift' : `${reward.requiredActions} Actions Needed`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: HOW IT WORKS & CONTRIBUTION LOG */}
        {activeTab === 'guide' && (
          <div className="space-y-4">
            <div className="glass-panel rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--nudge-accent)]">
                <Info className="w-4 h-4" />
                <span>Gentle Garden Philosophy</span>
              </div>
              <ul className="space-y-2 text-xs md:text-sm text-[var(--nudge-muted)] leading-relaxed">
                <li>
                  <strong className="text-[var(--nudge-ink)]">Zero Guilt, Ever:</strong> Plants never die, never wilt, and never lose progress if you take days or weeks off.
                </li>
                <li>
                  <strong className="text-[var(--nudge-ink)]">Automatic Background Growth:</strong> Each genuine positive action in Nudge adds <strong className="text-[var(--nudge-ink)]">+2 Garden Energy</strong> (1 nurtures a growing plant automatically, and 1 goes into your spendable pool—or +2 spendable if all planted pots are blooming).
                </li>
                <li>
                  <strong className="text-[var(--nudge-ink)]">Optional Care & Undo-Safe:</strong> Watering is purely an optional tactile ritual (+1 gentle care spark once per plant per day). Undoing an accidental completion reverses unspent energy cleanly without removing anything you permanently unlocked.
                </li>
                <li>
                  <strong className="text-[var(--nudge-ink)]">Journal Reflections:</strong> Writing in your Journal adds a calm +2 daily reflection bonus, never required.
                </li>
              </ul>
            </div>

            <div className="glass-panel rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-medium">Recent Garden Contributions</h3>
                <span className="font-mono-num text-xs text-[var(--nudge-muted)]">
                  {garden.totalEnergyEarned} total earned
                </span>
              </div>
              {garden.recentContributions.length === 0 ? (
                <p className="text-xs text-[var(--nudge-muted)]">
                  Complete any routine activity, checklist item, backpack item, scheduled task, or Bare Minimum step to nourish your garden.
                </p>
              ) : (
                <div className="divide-y divide-[var(--nudge-glass-border)] max-h-64 overflow-y-auto">
                  {garden.recentContributions.map((c) => (
                    <div key={c.id} className="py-2 flex items-center justify-between gap-3">
                      <span className="text-xs text-[var(--nudge-ink)] truncate">{c.label}</span>
                      <span className="font-mono-num text-xs font-medium text-[var(--nudge-accent)] shrink-0">
                        +{c.energy} Energy
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </GlassSheet>
  );
};
