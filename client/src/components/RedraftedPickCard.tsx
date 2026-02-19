import "./RedraftedPickCard.css";
import React, { useState } from "react";

type RedraftedPickCardProps = {
    redraftedPickNumber: number | null;
    originalPickNumber: number | null;
    playerName: string | null;
    playerPosition: string | null;
    playerCollegeOrClub: string | null;
    reDraftedBy: string | null;
    draftedBy: string | null;
    playerNbaStatsId: number | null;
    onClick: () => void;
    onUnassign: () => void;
}

function RedraftedPickCard({
    redraftedPickNumber,
    originalPickNumber,
    playerName,
    playerPosition,
    playerCollegeOrClub,
    reDraftedBy,
    draftedBy,
    playerNbaStatsId,
    onClick,
    onUnassign,
}: RedraftedPickCardProps) {
    const [preDraftImageError, setPreDraftImageError] = useState(false);
    const redraftedAbbr = reDraftedBy?.toLowerCase() ?? "nba";
    const originalAbbr = draftedBy?.toLowerCase() ?? "nba";
    const headshotSrc = `https://cdn.nba.com/headshots/nba/latest/1040x760/${playerNbaStatsId ?? 0}.png`;
    const playerPreDraft = playerCollegeOrClub?.toLowerCase().replace(/\s+/g, '').replace(/['.]/g, '')
    const style: React.CSSProperties = {
        background: `linear-gradient(
            90deg,
            var(--${redraftedAbbr}-grad-start),
            var(--${redraftedAbbr}-grad-end)
        )`,
    }
    const badgeStyle: React.CSSProperties = {
        '--ring-color': `var(--${redraftedAbbr}-grad-end)`,
    } as React.CSSProperties;

    return (
        <div className="redrafted-card" style={style}>
            <div className="redrafted-card-content">
                <div className="selection-number" style={badgeStyle}>
                    #{redraftedPickNumber}
                </div>
            </div>
        </div>
    )
};

export default RedraftedPickCard;