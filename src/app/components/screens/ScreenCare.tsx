import React from "react";
import { ScreenWrapper } from "../SharedElements";
import { Phone, ArrowLeft } from "lucide-react";
import { useNav, PAGES } from "../../navigation";

export function ScreenCare() {
  const nav = useNav();
  return (
    <ScreenWrapper className="bg-background">
      <div className="z-10 flex flex-col items-center h-full px-8 py-16">
        <div className="w-full flex justify-start items-center mb-20 mt-4">
          <button
            onClick={() => nav.goTo(PAGES.INTAKE_E)}
            className="flex items-center gap-1 text-foreground/70 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5 stroke-[1.5]" />
            <span className="text-xs tracking-widest font-serif">返回</span>
          </button>
        </div>

        <div className="mb-12 flex h-24 w-24 items-center justify-center rounded-full border border-border/60 bg-card/40 opacity-70">
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-foreground">
            <circle cx="50" cy="50" r="34" />
            <path d="M28 54 C42 35, 58 35, 72 54" strokeWidth="1" />
            <path d="M34 60 C44 70, 56 70, 66 60" strokeWidth="1" />
          </svg>
        </div>

        <div className="flex flex-col items-center gap-6 mb-24 text-center">
          <h2 className="font-serif text-3xl text-foreground tracking-widest leading-relaxed">
            此刻的沉重<br />值得被温柔接住
          </h2>
          <p className="text-sm text-card-foreground tracking-[0.1em] leading-loose max-w-[260px]">
            若此刻已经难以独自承受，请先把自己交给更及时、更专业的陪伴。你不必一个人熬过这一段。
          </p>
        </div>

        <div className="w-full rounded-[24px] border-[0.5px] border-border bg-card/70 p-8 shadow-sm flex flex-col items-center mb-8">
          <div className="text-xs text-muted-foreground tracking-[0.2em] mb-4">全国心理援助热线</div>
          <div className="font-sans text-3xl text-foreground tracking-widest mb-8 font-medium">
            400-161-9995
          </div>
          <a
            href="tel:400-161-9995"
            className="w-full py-4 rounded-full border-[0.5px] border-foreground/20 text-foreground bg-transparent hover:bg-foreground/5 transition-colors tracking-[0.2em] text-sm flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4" />
            <span>寻求专业帮助</span>
          </a>
        </div>

        <div className="text-center text-xs tracking-[0.18em] text-muted-foreground leading-loose">
          如果有家人、朋友或可信任的人在附近，
          <br />
          也请先联系他们陪在你身边。
        </div>
      </div>
    </ScreenWrapper>
  );
}
