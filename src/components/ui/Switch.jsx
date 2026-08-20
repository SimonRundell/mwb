/**
 * Switch — labelled on/off toggle.
 */
export default function Switch({ label, checked, onChange, disabled = false }) {
    return (
        <label className="switch-field">
            <span className="switch">
                <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={e => onChange(e.target.checked)}
                />
                <span className="switch-track" />
            </span>
            {label && <span className="switch-label">{label}</span>}
        </label>
    );
}
