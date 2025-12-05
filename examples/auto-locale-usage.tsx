import { SmartLocaleToggle } from "@/components/locale/smart-toggle";
import { useLocaleSwitcher } from "@/hooks/use-locale-switcher";

// 在组件中使用智能切换器
function AppHeader() {
  return (
    <header>
      <SmartLocaleToggle 
        variant="default"
        showAutoIndicator={true}
        enableNotifications={true}
        autoDetect={true}
        persistPreference={true}
      />
    </header>
  );
}

// 使用Hook进行语言切换
function LanguageSettings() {
  const { 
    currentLocale, 
    detectedLocale, 
    switchLocale,
    isSwitching 
  } = useLocaleSwitcher();

  const handleSwitchToEnglish = async () => {
    await switchLocale('en');
  };

  return (
    <div>
      <p>当前语言: {currentLocale}</p>
      <p>检测到的语言: {detectedLocale}</p>
      <button 
        onClick={handleSwitchToEnglish}
        disabled={isSwitching}
      >
        {isSwitching ? '切换中...' : '切换到英语'}
      </button>
    </div>
  );
}
