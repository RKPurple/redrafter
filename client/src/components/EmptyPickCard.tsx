import "./EmptyPickCard.css";
import React from "react";

type EmptyPickCardProps = {
    pickNumber: number | null;
    selectionTeam: string | null;
    isSelectionActive: boolean;
    onClick: () => void;
    readOnly?: boolean;
}

function EmptyPickCard({
    pickNumber,
    selectionTeam,
    isSelectionActive,
    onClick,
    readOnly = false,
}: EmptyPickCardProps) {
    const abbr = selectionTeam?.toLowerCase() ?? "nba";
    const style: React.CSSProperties = {
        background: `linear-gradient(
            90deg,
            var(--${abbr}-grad-start),
            var(--${abbr}-grad-end)
        )`,
    }
    const badgeStyle: React.CSSProperties = {
        '--ring-color': `var(--${abbr}-grad-end)`,
    } as React.CSSProperties;

    return (
        <div
            className={`empty-card${!readOnly && isSelectionActive ? " droppable" : ""}`}
            style={{ ...style, ...(readOnly && { cursor: 'default' }) }}
            onClick={!readOnly ? onClick : undefined}
        >
            <div className="empty-card-content">
                <div className="selection-number" style={badgeStyle}>
                    #{pickNumber}
                </div>
                <div className="drafting-team-logo">
                    <img
                        src={`/src/assets/teams/${abbr}.svg`}
                        alt={abbr}
                    />
                </div>
            </div>
        </div>
    )
};

export default EmptyPickCard;