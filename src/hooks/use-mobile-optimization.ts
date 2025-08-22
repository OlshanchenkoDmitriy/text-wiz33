import { useState, useEffect } from "react";

export const useMobileOptimization = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait"
  );

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setOrientation(width > height ? "landscape" : "portrait");
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    window.addEventListener("orientationchange", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
      window.removeEventListener("orientationchange", checkDevice);
    };
  }, []);

  // Оптимизации для мобильных устройств
  const mobileOptimizations = {
    // Размеры кнопок для сенсорного управления (48px минимум)
    buttonSize: isMobile ? "mobile" : "default" as "mobile" | "default",

    // Увеличиваем отступы для сенсорного управления
    touchPadding: isMobile ? "p-4 md:p-2" : "p-2",

    // Оптимизируем размеры шрифтов
    fontSize: isMobile ? "text-base md:text-sm" : "text-sm",

    // Увеличиваем высоту текстовых областей
    textareaHeight: isMobile ? "min-h-[300px] md:min-h-[200px]" : "min-h-[300px]",

    // Оптимизируем сетку для мобильных
    gridCols: isMobile ? "grid-cols-1 md:grid-cols-2" : "grid-cols-2",

    // Увеличиваем размеры иконок для сенсорного управления
    iconSize: isMobile ? "w-6 h-6 md:w-4 md:h-4" : "w-4 h-4",

    // Оптимизируем отступы между элементами
    spacing: isMobile ? "space-y-4 md:space-y-2" : "space-y-2",

    // Увеличиваем размеры карточек
    cardPadding: isMobile ? "p-4 md:p-3" : "p-3",

    // Минимальные тач-таргеты
    minTouchTarget: "min-h-[48px] min-w-[48px]",

    // Увеличенные отступы для форм
    formSpacing: isMobile ? "space-y-6 md:space-y-4" : "space-y-4",
  };

  return {
    isMobile,
    isTablet,
    orientation,
    mobileOptimizations,
  };
};
