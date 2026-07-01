# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

# Design Intelligence Skills

He activado e integrado dos sistemas de inteligencia de diseño avanzados:

1. **Impeccable (v2.1.1)**: Un lenguaje de diseño que evita la "estética genérica de IA". Sigue reglas estrictas de tipografía (evita Inter/Roboto), color (usa OKLCH), y composición (asimetría, ritmo visual).
   - _Instrucciones:_ [.gemini/skills/impeccable/skills/impeccable/SKILL.md](file:///.gemini/skills/impeccable/skills/impeccable/SKILL.md)

2. **UI-UX Pro Max**: Un motor de búsqueda de patrones de diseño, paletas y tipografías profesionales.
   - _Herramienta:_ `python3 .gemini/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain>`
   - _Dominios:_ `style`, `color`, `typography`, `ux`, `landing`, `chart`.

3. **Grill Me**: Un sistema de feedback agresivo para mejorar la calidad del código y diseño.
   - _Referencia:_ [Grill Me SKILL.md](file:///.gemini/skills/grill-me/SKILL.md)

4. **Caveman**: Enfoque de ingeniería simplificado y robusto.
   - _Referencia:_ [Caveman SKILL.md](file:///.gemini/skills/caveman/SKILL.md)

5. **Diagnose**: Herramienta de diagnóstico profundo para errores de ingeniería.
   - _Referencia:_ [Diagnose SKILL.md](file:///.gemini/skills/diagnose/SKILL.md)

6. **Web Design Guidelines**: Reglas modernas de Vercel Labs para interfaces de usuario limpias y efectivas.
   - _Instrucciones:_ [.agents/skills/web-design-guidelines/SKILL.md](file:///.agents/skills/web-design-guidelines/SKILL.md)

7. **SEO Audit**: Skill orientada a mejorar la estructura HTML para indexación y visibilidad en buscadores.
   - _Instrucciones:_ [.agents/skills/seo-audit/SKILL.md](file:///.agents/skills/seo-audit/SKILL.md)

8. **Audit Website**: Auditoría profunda de seguridad, rendimiento y accesibilidad utilizando Squirrelscan.
   - _Instrucciones:_ [.agents/skills/audit-website/SKILL.md](file:///.agents/skills/audit-website/SKILL.md)

# Reglas de Código Proyecto Nova Connect

1. **Alertas**: NO utilices `Alert.alert` nativo de `react-native`. Usa SIEMPRE la utilidad encapsulada `AlertHelper.alert` importada desde `@/lib/alert` para asegurar compatibilidad web/móvil.
2. **Toasts**: Contamos con nuestra propia utilidad para mostrar notificaciones efímeras. Utiliza SIEMPRE `showToast` importada desde `@/lib/toast` en lugar de librerías externas o utilidades nativas.
