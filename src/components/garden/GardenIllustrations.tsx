import React from 'react';
import {
  DecorationTypeId,
  GardenSeasonId,
  PlantSpeciesId,
  PotStyleId,
} from '../../types/nudge';
import { PLANT_SPECIES, POT_STYLES } from '../../data/gardenCatalog';

interface PotProps {
  potStyle: PotStyleId;
  className?: string;
}

export const PotIllustration: React.FC<PotProps> = ({ potStyle, className = 'w-full h-full' }) => {
  const style = POT_STYLES.find((p) => p.id === potStyle) || POT_STYLES[0];
  return (
    <g className={className}>
      {/* Soft ground shadow */}
      <ellipse cx="60" cy="109" rx="26" ry="5" fill="rgba(42,38,32,0.16)" />

      {/* Soil mound */}
      <ellipse cx="60" cy="80" rx="22" ry="5" fill="#5A4535" />

      {/* Pot body */}
      {potStyle === 'woven' ? (
        <>
          <path
            d="M37 81 C37 97, 43 107, 60 107 C77 107, 83 97, 83 81 Z"
            fill={style.body}
            stroke="#8B6F4C"
            strokeWidth="1.2"
          />
          <path d="M39 87 Q60 91 81 87" fill="none" stroke="#8B6F4C" strokeWidth="1.2" opacity="0.65" />
          <path d="M41 94 Q60 98 79 94" fill="none" stroke="#8B6F4C" strokeWidth="1.2" opacity="0.65" />
          <path d="M46 101 Q60 104 74 101" fill="none" stroke="#8B6F4C" strokeWidth="1.2" opacity="0.65" />
          <rect x="34" y="76" width="52" height="7" rx="3.5" fill={style.rim} stroke="#8B6F4C" strokeWidth="1" />
        </>
      ) : (
        <>
          <path
            d="M38 81 L43 106 C43.6 108, 76.4 108, 77 106 L82 81 Z"
            fill={style.body}
            stroke="rgba(48,47,45,0.16)"
            strokeWidth="1"
          />
          {/* Subtle ceramic highlight */}
          <path
            d="M44 85 L47.5 103"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {potStyle === 'porcelain' && (
            <path d="M41 93 Q60 96 79 93" fill="none" stroke="#8FA17F" strokeWidth="1.4" opacity="0.7" />
          )}
          <rect
            x="34"
            y="75"
            width="52"
            height="7.5"
            rx="3.5"
            fill={style.rim}
            stroke="rgba(48,47,45,0.16)"
            strokeWidth="1"
          />
        </>
      )}
    </g>
  );
};

interface PlantIllustrationProps {
  speciesId: PlantSpeciesId;
  potStyle: PotStyleId;
  stage: 1 | 2 | 3 | 4 | 5 | 6;
  wateredRecently?: boolean;
  className?: string;
}

export const PlantIllustration: React.FC<PlantIllustrationProps> = ({
  speciesId,
  potStyle,
  stage,
  wateredRecently = false,
  className = 'w-full h-full',
}) => {
  const def = PLANT_SPECIES.find((p) => p.id === speciesId) || PLANT_SPECIES[0];
  const { stem, leaf, bloom, center } = def.palette;

  const renderFoliageAndBloom = () => {
    // Stage 1: Seed nestled in soil
    if (stage === 1) {
      return (
        <g className="transition-all duration-500">
          <ellipse cx="60" cy="77" rx="4.5" ry="3" fill="#8C6B4A" />
          <path d="M58 76 Q60 73 62 76" fill="none" stroke="#B6946F" strokeWidth="1.2" />
        </g>
      );
    }

    // Stage 2: Tiny Sprout
    if (stage === 2) {
      return (
        <g className="transition-all duration-500">
          <path d="M60 79 Q60 68 60 63" stroke={stem} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M60 65 C55 60, 49 61, 51 66 C53 69, 58 68, 60 65 Z" fill={leaf} />
          <path d="M60 65 C65 60, 71 61, 69 66 C67 69, 62 68, 60 65 Z" fill={leaf} />
        </g>
      );
    }

    // Stage 3: Young Plant (shared sturdy base with species character)
    if (stage === 3) {
      if (speciesId === 'cactus') {
        return (
          <g>
            <rect x="53" y="54" width="14" height="26" rx="7" fill={stem} />
            <line x1="57" y1="58" x2="57" y2="76" stroke={leaf} strokeWidth="1.2" strokeDasharray="2 3" />
            <line x1="63" y1="58" x2="63" y2="76" stroke={leaf} strokeWidth="1.2" strokeDasharray="2 3" />
          </g>
        );
      }
      if (speciesId === 'cherry-blossom') {
        return (
          <g>
            <path d="M60 80 Q59 64 62 52" stroke={stem} strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M60 64 Q51 58 48 54" stroke={stem} strokeWidth="2" strokeLinecap="round" fill="none" />
            <ellipse cx="48" cy="53" rx="5" ry="3" fill={leaf} transform="rotate(-20 48 53)" />
            <ellipse cx="64" cy="51" rx="6" ry="3.5" fill={leaf} transform="rotate(15 64 51)" />
          </g>
        );
      }
      return (
        <g>
          <path d="M60 79 Q59 63 60 52" stroke={stem} strokeWidth="2.8" strokeLinecap="round" fill="none" />
          <path d="M60 69 C51 63, 44 66, 47 72 C50 75, 57 73, 60 69 Z" fill={leaf} />
          <path d="M60 65 C69 59, 76 62, 73 68 C70 71, 63 69, 60 65 Z" fill={leaf} />
          <path d="M60 56 C55 49, 50 51, 53 56 C55 59, 58 58, 60 56 Z" fill={leaf} />
          <path d="M60 56 C65 49, 70 51, 67 56 C65 59, 62 58, 60 56 Z" fill={leaf} />
        </g>
      );
    }

    // Species-specific stages 4, 5, 6
    const hasBud = stage === 4 || stage === 5;
    const isBlooming = stage === 6;

    switch (speciesId) {
      case 'sunflower':
        return (
          <g>
            <path
              d={stage >= 5 ? 'M60 80 Q57 54 60 32' : 'M60 80 Q58 60 60 44'}
              stroke={stem}
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            <path d="M59 68 C47 61, 40 66, 45 73 C49 77, 56 73, 59 68 Z" fill={leaf} />
            <path d="M60 57 C72 50, 79 55, 74 62 C70 66, 63 62, 60 57 Z" fill={leaf} />
            {stage >= 5 && (
              <path d="M59 46 C49 41, 44 45, 48 51 C51 54, 56 50, 59 46 Z" fill={leaf} />
            )}
            {stage === 4 && <circle cx="60" cy="42" r="6" fill={leaf} />}
            {stage === 5 && (
              <g>
                <circle cx="60" cy="31" r="8" fill={bloom} opacity="0.85" />
                <circle cx="60" cy="31" r="5" fill={center} />
              </g>
            )}
            {isBlooming && (
              <g transform="translate(60, 29)">
                {Array.from({ length: 12 }).map((_, i) => (
                  <ellipse
                    key={i}
                    cx="0"
                    cy="-14"
                    rx="4.2"
                    ry="9.5"
                    fill={bloom}
                    transform={`rotate(${i * 30})`}
                  />
                ))}
                <circle cx="0" cy="0" r="9.5" fill={center} />
                <circle cx="0" cy="0" r="6" fill="#52372A" opacity="0.45" />
              </g>
            )}
          </g>
        );

      case 'daisy':
        return (
          <g>
            <path d="M60 80 Q58 60 60 38" stroke={stem} strokeWidth="2.8" strokeLinecap="round" fill="none" />
            {stage >= 5 && (
              <path d="M60 72 Q49 58 44 46" stroke={stem} strokeWidth="2.2" strokeLinecap="round" fill="none" />
            )}
            {isBlooming && (
              <path d="M60 72 Q71 58 75 48" stroke={stem} strokeWidth="2.2" strokeLinecap="round" fill="none" />
            )}
            <path d="M59 71 C49 66, 42 70, 46 75 C50 78, 56 75, 59 71 Z" fill={leaf} />
            <path d="M61 68 C71 63, 78 67, 74 72 C70 75, 64 72, 61 68 Z" fill={leaf} />
            {hasBud && <circle cx="60" cy="37" r={stage === 5 ? 6 : 4} fill={stage === 5 ? bloom : leaf} />}
            {stage >= 5 && (
              <g transform="translate(44, 45) scale(0.68)">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ellipse
                    key={i}
                    cx="0"
                    cy="-9"
                    rx="3"
                    ry="7"
                    fill={bloom}
                    transform={`rotate(${i * 45})`}
                  />
                ))}
                <circle cx="0" cy="0" r="4.5" fill={center} />
              </g>
            )}
            {isBlooming && (
              <>
                <g transform="translate(60, 35)">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <ellipse
                      key={i}
                      cx="0"
                      cy="-10"
                      rx="3.4"
                      ry="7.5"
                      fill={bloom}
                      stroke="rgba(48,47,45,0.08)"
                      strokeWidth="0.6"
                      transform={`rotate(${i * 36})`}
                    />
                  ))}
                  <circle cx="0" cy="0" r="5.5" fill={center} />
                </g>
                <g transform="translate(75, 47) scale(0.62)">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <ellipse
                      key={i}
                      cx="0"
                      cy="-9"
                      rx="3"
                      ry="7"
                      fill={bloom}
                      transform={`rotate(${i * 45})`}
                    />
                  ))}
                  <circle cx="0" cy="0" r="4.5" fill={center} />
                </g>
              </>
            )}
          </g>
        );

      case 'wildflowers':
        return (
          <g>
            <path d="M60 80 Q51 60 44 42" stroke={stem} strokeWidth="2.2" fill="none" />
            <path d="M60 80 Q60 54 61 32" stroke={stem} strokeWidth="2.4" fill="none" />
            <path d="M60 80 Q69 58 76 40" stroke={stem} strokeWidth="2.2" fill="none" />
            <ellipse cx="52" cy="70" rx="6" ry="3.2" fill={leaf} transform="rotate(-25 52 70)" />
            <ellipse cx="68" cy="69" rx="6" ry="3.2" fill={leaf} transform="rotate(25 68 69)" />
            {stage >= 4 && (
              <circle cx="61" cy="34" r="4" fill={leaf} />
            )}
            {stage >= 5 && (
              <>
                <circle cx="44" cy="42" r="5.5" fill="#F2CC6B" />
                <circle cx="44" cy="42" r="2.2" fill="#D9943B" />
              </>
            )}
            {isBlooming && (
              <>
                <g transform="translate(61, 31)">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <circle
                      key={i}
                      cx={Math.cos((i * Math.PI) / 3) * 5}
                      cy={Math.sin((i * Math.PI) / 3) * 5}
                      r="3.8"
                      fill={bloom}
                    />
                  ))}
                  <circle cx="0" cy="0" r="3" fill={center} />
                </g>
                <g transform="translate(76, 40)">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <circle
                      key={i}
                      cx={Math.cos((i * Math.PI * 2) / 5) * 4}
                      cy={Math.sin((i * Math.PI * 2) / 5) * 4}
                      r="3.2"
                      fill="#EA9BB0"
                    />
                  ))}
                  <circle cx="0" cy="0" r="2.2" fill="#FFF7D6" />
                </g>
              </>
            )}
          </g>
        );

      case 'lavender':
        return (
          <g>
            {[
              { x: 48, topY: stage >= 5 ? 36 : 48 },
              { x: 60, topY: stage >= 5 ? 26 : 40 },
              { x: 72, topY: stage >= 5 ? 34 : 46 },
            ].map((s, idx) => (
              <g key={idx}>
                <path
                  d={`M60 80 Q${(60 + s.x) / 2} 60 ${s.x} ${s.topY}`}
                  stroke={stem}
                  strokeWidth="2.2"
                  fill="none"
                />
                {stage >= 4 && (
                  <>
                    <ellipse cx={s.x - 2} cy={s.topY + 12} rx="2.4" ry="3.2" fill={stage >= 5 ? bloom : leaf} />
                    <ellipse cx={s.x + 2} cy={s.topY + 9} rx="2.4" ry="3.2" fill={stage >= 5 ? center : leaf} />
                  </>
                )}
                {stage >= 5 && (
                  <>
                    <ellipse cx={s.x - 2.2} cy={s.topY + 5} rx="2.6" ry="3.4" fill={bloom} />
                    <ellipse cx={s.x + 2.2} cy={s.topY + 2} rx="2.6" ry="3.4" fill={center} />
                    <ellipse cx={s.x} cy={s.topY - 2} rx="2.6" ry="3.6" fill={bloom} />
                  </>
                )}
                {isBlooming && (
                  <ellipse cx={s.x} cy={s.topY - 6} rx="2.4" ry="3.4" fill={center} />
                )}
              </g>
            ))}
            <path d="M58 76 C49 66, 42 63, 44 60 C48 63, 55 70, 58 76 Z" fill={leaf} />
            <path d="M62 76 C71 66, 78 63, 76 60 C72 63, 65 70, 62 76 Z" fill={leaf} />
          </g>
        );

      case 'tulip':
        return (
          <g>
            <path d="M60 80 Q59 58 60 36" stroke={stem} strokeWidth="3.2" strokeLinecap="round" fill="none" />
            {/* Broad upright tulip leaves */}
            <path d="M58 80 C44 68, 43 49, 49 44 C52 53, 55 68, 59 79 Z" fill={leaf} />
            <path d="M62 80 C76 68, 77 49, 71 44 C68 53, 65 68, 61 79 Z" fill={leaf} />
            {stage === 4 && (
              <ellipse cx="60" cy="36" rx="5.5" ry="9" fill={leaf} />
            )}
            {stage === 5 && (
              <path d="M52 38 C52 24, 68 24, 68 38 C68 44, 52 44, 52 38 Z" fill={bloom} />
            )}
            {isBlooming && (
              <g transform="translate(60, 32)">
                <path d="M-11 2 C-11 -10, -2 -14, 0 -4 C2 -14, 11 -10, 11 2 C11 10, -11 10, -11 2 Z" fill={bloom} />
                <path d="M-5 3 C-5 -8, 0 -13, 0 -13 C0 -13, 5 -8, 5 3 C5 9, -5 9, -5 3 Z" fill={center} opacity="0.85" />
              </g>
            )}
          </g>
        );

      case 'strawberry':
        return (
          <g>
            <path d="M60 80 Q50 64 45 55" stroke={stem} strokeWidth="2.2" fill="none" />
            <path d="M60 80 Q60 58 60 44" stroke={stem} strokeWidth="2.4" fill="none" />
            <path d="M60 80 Q70 64 75 55" stroke={stem} strokeWidth="2.2" fill="none" />
            {/* Trifoliate leaves */}
            <circle cx="44" cy="54" r="6" fill={leaf} />
            <circle cx="60" cy="43" r="7" fill={leaf} />
            <circle cx="76" cy="54" r="6" fill={leaf} />
            <circle cx="52" cy="64" r="5" fill={stem} />
            <circle cx="68" cy="64" r="5" fill={stem} />
            {stage >= 5 && (
              <g transform="translate(47, 50)">
                <circle cx="0" cy="-3" r="2.6" fill={center} />
                <circle cx="3" cy="0" r="2.6" fill={center} />
                <circle cx="0" cy="3" r="2.6" fill={center} />
                <circle cx="-3" cy="0" r="2.6" fill={center} />
                <circle cx="0" cy="0" r="1.8" fill="#EBB844" />
              </g>
            )}
            {isBlooming && (
              <>
                <path d="M69 57 C65 57, 64 65, 69 68 C74 65, 73 57, 69 57 Z" fill={bloom} />
                <path d="M51 58 C47 58, 46 66, 51 69 C56 66, 55 58, 51 58 Z" fill={bloom} />
                <circle cx="68" cy="61" r="0.6" fill="#FCE2A6" />
                <circle cx="70" cy="63" r="0.6" fill="#FCE2A6" />
                <circle cx="50" cy="62" r="0.6" fill="#FCE2A6" />
                <circle cx="52" cy="64" r="0.6" fill="#FCE2A6" />
              </>
            )}
          </g>
        );

      case 'cactus':
        return (
          <g>
            <rect x="51" y="38" width="18" height="42" rx="9" fill={stem} />
            <line x1="56" y1="43" x2="56" y2="76" stroke={leaf} strokeWidth="1.4" strokeDasharray="2 3" />
            <line x1="64" y1="43" x2="64" y2="76" stroke={leaf} strokeWidth="1.4" strokeDasharray="2 3" />
            {stage >= 4 && (
              <path d="M51 58 L44 58 C40 58, 40 54, 40 48 C40 44, 46 44, 46 48 L46 53 L51 53 Z" fill={stem} />
            )}
            {stage >= 5 && (
              <path d="M69 54 L76 54 C80 54, 80 50, 80 44 C80 40, 74 40, 74 44 L74 49 L69 49 Z" fill={stem} />
            )}
            {isBlooming && (
              <g transform="translate(60, 34)">
                <ellipse cx="-4" cy="0" rx="4" ry="5.5" fill={bloom} transform="rotate(-22 -4 0)" />
                <ellipse cx="4" cy="0" rx="4" ry="5.5" fill={bloom} transform="rotate(22 4 0)" />
                <ellipse cx="0" cy="-2" rx="3.8" ry="6" fill="#F4A6B8" />
                <circle cx="0" cy="1" r="2.4" fill={center} />
              </g>
            )}
          </g>
        );

      case 'monstera':
        return (
          <g>
            <path d="M60 80 Q54 60 47 46" stroke={stem} strokeWidth="2.6" fill="none" />
            <path d="M60 80 Q66 60 73 48" stroke={stem} strokeWidth="2.6" fill="none" />
            {stage >= 5 && <path d="M60 80 Q60 54 60 34" stroke={stem} strokeWidth="3" fill="none" />}
            {/* Split heart leaves */}
            <path
              d="M47 46 C36 42, 34 56, 44 60 C46 56, 51 53, 54 50 C52 46, 50 44, 47 46 Z"
              fill={leaf}
            />
            <path
              d="M73 48 C84 44, 86 58, 76 62 C74 58, 69 55, 66 52 C68 48, 70 46, 73 48 Z"
              fill={stem}
            />
            {stage >= 5 && (
              <g transform="translate(60, 34)">
                <path
                  d="M0 -14 C-12 -14, -17 -2, -12 8 C-7 14, -2 12, 0 10 C2 12, 7 14, 12 8 C17 -2, 12 -14, 0 -14 Z"
                  fill={isBlooming ? bloom : leaf}
                />
                {/* Characteristic fenestration slits */}
                <line x1="-12" y1="-2" x2="-4" y2="-1" stroke="#3C593F" strokeWidth="1.4" strokeLinecap="round" />
                <line x1="12" y1="-2" x2="4" y2="-1" stroke="#3C593F" strokeWidth="1.4" strokeLinecap="round" />
                <line x1="-10" y1="5" x2="-4" y2="4" stroke="#3C593F" strokeWidth="1.4" strokeLinecap="round" />
                <line x1="10" y1="5" x2="4" y2="4" stroke="#3C593F" strokeWidth="1.4" strokeLinecap="round" />
              </g>
            )}
          </g>
        );

      case 'rose':
        return (
          <g>
            <path d="M60 80 Q58 58 60 34" stroke={stem} strokeWidth="2.8" fill="none" />
            <path d="M59 68 C49 62, 43 66, 47 71 C51 74, 57 71, 59 68 Z" fill={leaf} />
            <path d="M61 58 C71 52, 77 56, 73 61 C69 64, 63 61, 61 58 Z" fill={leaf} />
            {stage === 4 && (
              <ellipse cx="60" cy="36" rx="4.5" ry="6.5" fill={leaf} />
            )}
            {stage === 5 && (
              <path d="M54 36 C54 27, 66 27, 66 36 C66 41, 54 41, 54 36 Z" fill={bloom} />
            )}
            {isBlooming && (
              <g transform="translate(60, 32)">
                <circle cx="-5" cy="1" r="7" fill={bloom} />
                <circle cx="5" cy="1" r="7" fill={bloom} />
                <circle cx="0" cy="-3" r="7.5" fill="#DC7D8A" />
                <circle cx="0" cy="0" r="5" fill={center} />
                <path d="M-3 -1 Q0 3 3 -1" fill="none" stroke="#B64E5D" strokeWidth="1.3" />
              </g>
            )}
          </g>
        );

      case 'cherry-blossom':
        return (
          <g>
            {/* Gnarled bonsai sakura trunk */}
            <path
              d="M60 80 C57 68, 56 58, 61 48 C64 41, 61 36, 56 32"
              stroke={stem}
              strokeWidth="4.8"
              strokeLinecap="round"
              fill="none"
            />
            <path d="M59 56 Q46 50 41 44" stroke={stem} strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M61 50 Q73 45 78 40" stroke={stem} strokeWidth="2.8" strokeLinecap="round" fill="none" />

            {stage === 4 && (
              <>
                <circle cx="42" cy="43" r="7" fill={leaf} />
                <circle cx="58" cy="32" r="9" fill={leaf} />
                <circle cx="77" cy="40" r="7" fill={leaf} />
              </>
            )}

            {stage >= 5 && (
              <>
                <circle cx="42" cy="42" r="9" fill={bloom} />
                <circle cx="58" cy="30" r="12" fill={bloom} />
                <circle cx="77" cy="39" r="9.5" fill={bloom} />
                <circle cx="49" cy="35" r="8" fill={center} opacity="0.85" />
                <circle cx="68" cy="33" r="8" fill={center} opacity="0.85" />
              </>
            )}

            {isBlooming && (
              <>
                <circle cx="58" cy="24" r="9" fill={center} />
                <circle cx="45" cy="43" r="2.2" fill="#E389A2" />
                <circle cx="60" cy="29" r="2.4" fill="#E389A2" />
                <circle cx="74" cy="38" r="2.2" fill="#E389A2" />
                {/* Falling petal */}
                <ellipse cx="47" cy="60" rx="2" ry="1.2" fill={bloom} transform="rotate(30 47 60)" />
              </>
            )}
          </g>
        );
    }
  };

  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <PotIllustration potStyle={potStyle} />
      {renderFoliageAndBloom()}
      {wateredRecently && (
        <g opacity="0.85">
          <path
            d="M84 32 C84 32, 88 37, 88 40 A4 4 0 1 1 80 40 C80 37, 84 32, 84 32 Z"
            fill="#6FB6DB"
          />
        </g>
      )}
    </svg>
  );
};

export const DecorationIllustration: React.FC<{
  decorationId: DecorationTypeId;
  isDarkBg?: boolean;
  className?: string;
}> = ({ decorationId, isDarkBg = false, className = 'w-full h-full' }) => {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      {decorationId === 'rocks' && (
        <g>
          <ellipse cx="60" cy="96" rx="28" ry="6" fill="rgba(42,38,32,0.12)" />
          <ellipse cx="52" cy="86" rx="16" ry="11" fill="#9AA096" />
          <ellipse cx="70" cy="89" rx="13" ry="9" fill="#B2B6AD" />
          <ellipse cx="60" cy="80" rx="10" ry="7" fill="#828A7F" />
          <path d="M44 82 Q52 77 60 82" fill="none" stroke="#789668" strokeWidth="3.5" strokeLinecap="round" />
        </g>
      )}

      {decorationId === 'path' && (
        <g>
          <ellipse cx="44" cy="96" rx="12" ry="6" fill="#C7BCA9" stroke="#A89C87" strokeWidth="1.2" />
          <ellipse cx="67" cy="85" rx="11" ry="5.5" fill="#D4C9B6" stroke="#A89C87" strokeWidth="1.2" />
          <ellipse cx="53" cy="73" rx="9.5" ry="4.8" fill="#C7BCA9" stroke="#A89C87" strokeWidth="1.2" />
        </g>
      )}

      {decorationId === 'mushrooms' && (
        <g>
          <ellipse cx="60" cy="98" rx="22" ry="4.5" fill="rgba(42,38,32,0.12)" />
          <rect x="46" y="76" width="8" height="20" rx="3" fill="#F2E9D8" />
          <path d="M35 78 C35 61, 65 61, 65 78 Z" fill="#D56C5C" />
          <circle cx="45" cy="70" r="2.2" fill="#FFF9F0" />
          <circle cx="55" cy="72" r="1.8" fill="#FFF9F0" />
          <rect x="68" y="83" width="6" height="14" rx="2.5" fill="#F2E9D8" />
          <path d="M60 85 C60 74, 82 74, 82 85 Z" fill="#E39B68" />
          <circle cx="70" cy="80" r="1.6" fill="#FFF9F0" />
        </g>
      )}

      {decorationId === 'deco-flowers' && (
        <g>
          <ellipse cx="60" cy="96" rx="26" ry="8" fill="#7D9B6E" opacity="0.55" />
          {[
            { x: 44, y: 82, c: '#F5E38A' },
            { x: 60, y: 74, c: '#FFFDF7' },
            { x: 74, y: 84, c: '#EBA4B5' },
            { x: 54, y: 90, c: '#FFFDF7' },
          ].map((f, i) => (
            <g key={i} transform={`translate(${f.x}, ${f.y})`}>
              <circle cx="-3" cy="0" r="3" fill={f.c} />
              <circle cx="3" cy="0" r="3" fill={f.c} />
              <circle cx="0" cy="-3" r="3" fill={f.c} />
              <circle cx="0" cy="3" r="3" fill={f.c} />
              <circle cx="0" cy="0" r="2" fill="#E5B85B" />
            </g>
          ))}
        </g>
      )}

      {decorationId === 'fence' && (
        <g>
          <rect x="26" y="74" width="68" height="6" rx="2" fill="#A6825C" />
          <rect x="26" y="88" width="68" height="6" rx="2" fill="#A6825C" />
          {[32, 49, 66, 83].map((x) => (
            <path
              key={x}
              d={`M${x} 99 L${x} 66 L${x + 5} 60 L${x + 10} 66 L${x + 10} 99 Z`}
              fill="#C49D74"
              stroke="#8F6D4B"
              strokeWidth="1"
            />
          ))}
        </g>
      )}

      {decorationId === 'lantern' && (
        <g>
          {isDarkBg && <circle cx="60" cy="70" r="34" fill="rgba(246, 200, 102, 0.24)" />}
          <ellipse cx="60" cy="100" rx="16" ry="4" fill="rgba(42,38,32,0.16)" />
          <rect x="52" y="92" width="16" height="6" rx="2" fill="#4E4A45" />
          <rect x="49" y="60" width="22" height="32" rx="3" fill="#4E4A45" />
          <rect x="53" y="64" width="14" height="24" rx="2" fill="#F9CF6D" />
          <ellipse cx="60" cy="76" rx="4" ry="7" fill="#FFF6D6" />
          <path d="M44 60 L60 47 L76 60 Z" fill="#4E4A45" />
          <circle cx="60" cy="45" r="2.5" fill="#4E4A45" />
        </g>
      )}

      {decorationId === 'bench' && (
        <g>
          <ellipse cx="60" cy="99" rx="32" ry="4.5" fill="rgba(42,38,32,0.14)" />
          <rect x="33" y="78" width="5" height="20" rx="1.5" fill="#6F543D" />
          <rect x="82" y="78" width="5" height="20" rx="1.5" fill="#6F543D" />
          <rect x="28" y="61" width="64" height="7" rx="2" fill="#B58A62" />
          <rect x="28" y="70" width="64" height="6" rx="2" fill="#A67C55" />
          <rect x="26" y="81" width="68" height="7" rx="2.5" fill="#C49A71" />
        </g>
      )}

      {decorationId === 'birdhouse' && (
        <g>
          <ellipse cx="60" cy="102" rx="14" ry="4" fill="rgba(42,38,32,0.14)" />
          <rect x="57" y="70" width="6" height="32" rx="2" fill="#8C6B4A" />
          <rect x="44" y="45" width="32" height="27" rx="3" fill="#EAE4D7" stroke="#BDB4A4" strokeWidth="1" />
          <path d="M39 47 L60 30 L81 47 Z" fill="#7D9876" />
          <circle cx="60" cy="57" r="5" fill="#4A3B31" />
          <rect x="57" y="65" width="6" height="2.5" rx="1" fill="#8C6B4A" />
        </g>
      )}

      {decorationId === 'butterflies' && (
        <g>
          <g transform="translate(46, 54) rotate(-15)">
            <ellipse cx="-6" cy="-4" rx="7" ry="5" fill="#E8B85C" />
            <ellipse cx="6" cy="-4" rx="7" ry="5" fill="#E8B85C" />
            <ellipse cx="-5" cy="4" rx="5" ry="4" fill="#F4D38B" />
            <ellipse cx="5" cy="4" rx="5" ry="4" fill="#F4D38B" />
            <rect x="-1" y="-6" width="2" height="12" rx="1" fill="#5A4535" />
          </g>
          <g transform="translate(74, 40) rotate(16) scale(0.8)">
            <ellipse cx="-6" cy="-4" rx="7" ry="5" fill="#99B7DC" />
            <ellipse cx="6" cy="-4" rx="7" ry="5" fill="#99B7DC" />
            <ellipse cx="-5" cy="4" rx="5" ry="4" fill="#C2D6EE" />
            <ellipse cx="5" cy="4" rx="5" ry="4" fill="#C2D6EE" />
            <rect x="-1" y="-6" width="2" height="12" rx="1" fill="#4A4A58" />
          </g>
        </g>
      )}

      {decorationId === 'pond' && (
        <g>
          <ellipse cx="60" cy="86" rx="34" ry="16" fill="#9CC1CE" stroke="#859E88" strokeWidth="2.5" />
          <ellipse cx="58" cy="84" rx="26" ry="10" fill="#B5D3DE" opacity="0.65" />
          <path d="M47 84 A7 5 0 1 1 53 81 L47 84 Z" fill="#6F9A66" />
          <path d="M71 89 A6 4 0 1 1 76 87 L71 89 Z" fill="#7CA872" />
          <circle cx="72" cy="85" r="3" fill="#F2B8C6" />
        </g>
      )}
    </svg>
  );
};

export const FrogCompanionSVG: React.FC<{ hopped?: boolean; className?: string }> = ({
  hopped = false,
  className = 'w-14 h-14',
}) => (
  <svg
    viewBox="0 0 80 80"
    className={`${className} transition-transform duration-300 ${hopped ? '-translate-y-2 scale-105' : ''}`}
    aria-hidden="true"
  >
    {/* Lily pad / flat stone */}
    <ellipse cx="40" cy="67" rx="24" ry="6" fill="#779A6D" opacity="0.7" />
    {/* Body */}
    <ellipse cx="40" cy="51" rx="18" ry="14" fill="#7EA86E" />
    <ellipse cx="40" cy="54" rx="12" ry="9" fill="#DCE8C8" />
    {/* Eyes */}
    <circle cx="31" cy="36" r="6" fill="#7EA86E" />
    <circle cx="49" cy="36" r="6" fill="#7EA86E" />
    <circle cx="31" cy="35" r="3.2" fill="#2E302C" />
    <circle cx="49" cy="35" r="3.2" fill="#2E302C" />
    <circle cx="32" cy="34" r="1.1" fill="#FFFFFF" />
    <circle cx="50" cy="34" r="1.1" fill="#FFFFFF" />
    {/* Rosy cheeks & gentle smile */}
    <circle cx="27" cy="44" r="2.6" fill="#E99A98" opacity="0.7" />
    <circle cx="53" cy="44" r="2.6" fill="#E99A98" opacity="0.7" />
    <path d="M35 45 Q40 49 45 45" fill="none" stroke="#3E5736" strokeWidth="1.8" strokeLinecap="round" />
    {/* Front paws */}
    <ellipse cx="28" cy="61" rx="4" ry="2.5" fill="#6F985F" />
    <ellipse cx="52" cy="61" rx="4" ry="2.5" fill="#6F985F" />
  </svg>
);

export const SeasonalParticles: React.FC<{ season: Exclude<GardenSeasonId, 'auto'> }> = ({ season }) => {
  if (season === 'spring') {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {[
          { left: '12%', top: '14%', delay: '0s' },
          { left: '38%', top: '22%', delay: '1.2s' },
          { left: '68%', top: '10%', delay: '0.6s' },
          { left: '84%', top: '28%', delay: '2.1s' },
        ].map((p, i) => (
          <span
            key={i}
            className="absolute w-2.5 h-1.5 rounded-full bg-pink-200/80 dark:bg-pink-300/50 animate-pulse"
            style={{ left: p.left, top: p.top, animationDelay: p.delay }}
          />
        ))}
      </div>
    );
  }
  if (season === 'summer') {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {[
          { left: '18%', top: '18%', delay: '0.4s' },
          { left: '54%', top: '14%', delay: '1.5s' },
          { left: '78%', top: '24%', delay: '0.8s' },
        ].map((p, i) => (
          <span
            key={i}
            className="absolute w-2 h-2 rounded-full bg-amber-200/80 animate-pulse"
            style={{ left: p.left, top: p.top, animationDelay: p.delay }}
          />
        ))}
      </div>
    );
  }
  if (season === 'autumn') {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {[
          { left: '15%', top: '12%', color: '#D98548' },
          { left: '46%', top: '18%', color: '#C96348' },
          { left: '73%', top: '11%', color: '#DFAD53' },
          { left: '88%', top: '26%', color: '#C96348' },
        ].map((p, i) => (
          <span
            key={i}
            className="absolute w-2.5 h-1.5 rounded-full opacity-75 animate-pulse"
            style={{ left: p.left, top: p.top, backgroundColor: p.color }}
          />
        ))}
      </div>
    );
  }
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {[
        { left: '14%', top: '14%' },
        { left: '34%', top: '24%' },
        { left: '59%', top: '12%' },
        { left: '82%', top: '20%' },
        { left: '70%', top: '32%' },
      ].map((p, i) => (
        <span
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse"
          style={{ left: p.left, top: p.top }}
        />
      ))}
    </div>
  );
};
