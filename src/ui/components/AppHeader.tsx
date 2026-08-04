import { useEffect, useId, useRef, useState } from "react";
import {
  readColorMode,
  toggleColorMode,
  type ColorMode,
} from "../color-mode";

const GITHUB_REPO_URL =
  "https://github.com/sergimax/keyboard-heatmap";
const AUTHOR_SITE_URL = "https://sergimax.ru";

type AppHeaderProps = {
  live: boolean;
  resetting: boolean;
  onExport: () => void;
  onReset: () => void;
};

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.56 9.56 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.523 2 12 2z"
      />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0-5h1v3h-2V2h1zm0 17h1v3h-2v-3h1zM2 11h3v2H2v-2zm17 0h3v2h-3v-2zM4.22 4.22l1.42 1.42-1.42 1.41L2.8 5.64l1.42-1.42zm14.14 14.14 1.42 1.42-1.42 1.41-1.41-1.41 1.41-1.42zM4.22 19.78l1.42-1.42 1.41 1.42-1.41 1.41-1.42-1.41zm14.14-14.14 1.42-1.42 1.41 1.42-1.41 1.41-1.42-1.41z"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12.7 2a9.2 9.2 0 0 0-1.1.07A8.5 8.5 0 1 0 20.93 13.4 9 9 0 0 1 12.7 2z"
      />
    </svg>
  );
}

export function AppHeader({
  live,
  resetting,
  onExport,
  onReset,
}: AppHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [colorMode, setColorMode] = useState<ColorMode>(() => readColorMode());
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen]);

  function runAction(action: () => void) {
    setMenuOpen(false);
    action();
  }

  function onToggleTheme() {
    setColorMode(toggleColorMode());
  }

  return (
    <header className="app-bar">
      <div className="app-toolbar">
        <div className="app-toolbar-brand">
          <img
            className="app-logo"
            src={`${import.meta.env.BASE_URL}logo.svg`}
            width={28}
            height={28}
            alt=""
          />
          <h1 className="app-title">Keyboard Heatmap</h1>
        </div>

        <div className="app-toolbar-center">
          <div className="app-toolbar-actions app-toolbar-actions-desktop">
            <button
              type="button"
              className="btn-toolbar btn-toolbar-primary"
              onClick={onExport}
            >
              Export
            </button>
            {live ? (
              <button
                type="button"
                className="btn-toolbar btn-toolbar-danger"
                disabled={resetting}
                onClick={onReset}
              >
                Reset
              </button>
            ) : null}
          </div>

          <div className="app-toolbar-compact" ref={menuRef}>
            <button
              type="button"
              className={`btn-icon${menuOpen ? " is-active" : ""}`}
              aria-label="Actions"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MenuIcon />
            </button>
            {menuOpen ? (
              <div
                id={menuId}
                className="app-menu"
                role="menu"
                aria-label="Actions"
              >
                <button
                  type="button"
                  role="menuitem"
                  className="app-menu-item"
                  onClick={() => runAction(onExport)}
                >
                  Export
                </button>
                {live ? (
                  <button
                    type="button"
                    role="menuitem"
                    className="app-menu-item app-menu-item-danger"
                    disabled={resetting}
                    onClick={() => runAction(onReset)}
                  >
                    Reset
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="app-toolbar-meta">
          <button
            type="button"
            className="btn-icon"
            onClick={onToggleTheme}
            title={colorMode === "dark" ? "Switch to light" : "Switch to dark"}
            aria-label={
              colorMode === "dark" ? "Switch to light theme" : "Switch to dark theme"
            }
          >
            {colorMode === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          <a
            className="btn-icon"
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub repository"
            aria-label="GitHub repository"
          >
            <GitHubIcon />
          </a>
          <a
            className="btn-icon"
            href={AUTHOR_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Author site"
            aria-label="Author site"
          >
            <HomeIcon />
          </a>
          <span className="app-version" title="App version">
            v.{__APP_VERSION__}
          </span>
        </div>
      </div>
    </header>
  );
}
