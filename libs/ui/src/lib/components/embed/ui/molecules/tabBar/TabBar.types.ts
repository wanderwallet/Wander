type tab = {
  label: string;
};

export type TabBarBaseProps = {
  tabs: tab[];
  className?: string;
  setActiveTab: (index: number) => void;
  activeTab: number;
  [key: string]: any;
};
