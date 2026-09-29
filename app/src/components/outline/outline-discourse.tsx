"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import {
    ArrowLeft,
    Maximize,
    Minimize,
    Minus,
    Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { BibleVerse } from "./bible-verse-node";
import { VersePanel } from "./verse-panel";
import { useEditorContext } from "./editor-context";

interface OutlineDiscourseProps {
    title: string;
    category?: string | null;
    content: any;
}

const FONT_SIZES = {
    small: 18,
    medium: 21,
    large: 24,
    xlarge: 28,
};

type FontSize = keyof typeof FONT_SIZES;

export default function OutlineDiscourse({
    title,
    category,
    content,
}: OutlineDiscourseProps) {
    const router = useRouter();

    const { isPanelOpen } = useEditorContext();

    const [fontSize, setFontSize] = useState<FontSize>("medium");
    const [isFullscreen, setIsFullscreen] = useState(false);

    /*
     * Editor somente para leitura.
     *
     * Não existe cursor de edição,
     * toolbar ou possibilidade de alterar
     * o conteúdo do esboço.
     */
    const editor = useEditor({
        editable: false,

        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),

            Underline,

            Placeholder.configure({
                placeholder: "",
            }),

            BibleVerse,
        ],

        content: content || {
            type: "doc",
            content: [],
        },

        editorProps: {
            attributes: {
                class: "discourse-editor focus:outline-none w-full min-w-0",
            },
        },
    });

    /*
     * Detecta quando o navegador entra ou sai
     * do modo tela cheia.
     */
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };

        document.addEventListener(
            "fullscreenchange",
            handleFullscreenChange
        );

        return () => {
            document.removeEventListener(
                "fullscreenchange",
                handleFullscreenChange
            );
        };
    }, []);

    /*
     * Tela cheia
     */
    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (error) {
            console.error(
                "Erro ao alternar tela cheia:",
                error
            );
        }
    };

    /*
     * Aumentar fonte
     */
    const increaseFontSize = () => {
        setFontSize((current) => {
            if (current === "small") {
                return "medium";
            }

            if (current === "medium") {
                return "large";
            }

            if (current === "large") {
                return "xlarge";
            }

            return "xlarge";
        });
    };

    /*
     * Diminuir fonte
     */
    const decreaseFontSize = () => {
        setFontSize((current) => {
            if (current === "xlarge") {
                return "large";
            }

            if (current === "large") {
                return "medium";
            }

            if (current === "medium") {
                return "small";
            }

            return "small";
        });
    };

    /*
     * Enquanto o Tiptap inicializa.
     */
    if (!editor) {
        return null;
    }

    return (
        <div
            className={`discourse-page ${isFullscreen
                ? "discourse-fullscreen"
                : ""
                }`}
        >
            {/* ======================================================
          HEADER
      ====================================================== */}

            <header className="discourse-header">

                {/* ESQUERDA */}

                <div className="discourse-header-left">

                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="discourse-icon-button"
                        aria-label="Voltar"
                        title="Voltar"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <div className="discourse-header-title">

                        <span className="discourse-header-main-title">
                            {title || "Sem título"}
                        </span>

                        {category && (
                            <span className="discourse-header-category">
                                {category}
                            </span>
                        )}

                    </div>

                </div>

                {/* DIREITA */}

                <div className="discourse-header-actions">

                    {/* CONTROLE DE FONTE */}

                    <div className="discourse-font-controls">

                        <button
                            type="button"
                            onClick={decreaseFontSize}
                            className="discourse-control-button"
                            aria-label="Diminuir tamanho do texto"
                            title="Diminuir texto"
                            disabled={fontSize === "small"}
                        >
                            <Minus size={17} />
                        </button>

                        <span className="discourse-font-label">
                            Aa
                        </span>

                        <button
                            type="button"
                            onClick={increaseFontSize}
                            className="discourse-control-button"
                            aria-label="Aumentar tamanho do texto"
                            title="Aumentar texto"
                            disabled={fontSize === "xlarge"}
                        >
                            <Plus size={17} />
                        </button>

                    </div>

                    {/* TELA CHEIA */}

                    <button
                        type="button"
                        onClick={toggleFullscreen}
                        className="discourse-icon-button"
                        aria-label={
                            isFullscreen
                                ? "Sair da tela cheia"
                                : "Tela cheia"
                        }
                        title={
                            isFullscreen
                                ? "Sair da tela cheia"
                                : "Tela cheia"
                        }
                    >
                        {isFullscreen ? (
                            <Minimize size={19} />
                        ) : (
                            <Maximize size={19} />
                        )}
                    </button>

                </div>

            </header>

            {/* ======================================================
          CONTEÚDO
      ====================================================== */}

            <main
                className={`discourse-layout ${isPanelOpen
                    ? "has-study-panel"
                    : ""
                    }`}
            >

                {/* DOCUMENTO */}

                <section className="discourse-content">

                    <div className="discourse-document">

                        {/* TÍTULO */}

                        <div className="discourse-heading">

                            <h1>
                                {title || "Sem título"}
                            </h1>

                            {category && (
                                <span className="discourse-category">
                                    {category}
                                </span>
                            )}

                        </div>

                        {/* TEXTO */}

                        <div
                            className="discourse-body"
                            style={{
                                fontSize:
                                    `${FONT_SIZES[fontSize]}px`,
                            }}
                        >
                            <EditorContent
                                editor={editor}
                            />
                        </div>

                        {/* ESPAÇO FINAL */}

                        <div className="discourse-end-space" />

                    </div>

                </section>

                {/* PAINEL BÍBLICO */}

                <VersePanel />

            </main>

        </div>
    );
}