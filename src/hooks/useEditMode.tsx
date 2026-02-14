import { createContext, useContext, useState, ReactNode } from "react";
import { useAuth } from "./useAuth";

interface EditModeContextType {
  isEditMode: boolean;
  toggleEditMode: () => void;
  canEdit: boolean;
}

const EditModeContext = createContext<EditModeContextType>({
  isEditMode: false,
  toggleEditMode: () => {},
  canEdit: false,
});

export const EditModeProvider = ({ children }: { children: ReactNode }) => {
  const { isAdmin } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);

  const toggleEditMode = () => {
    if (isAdmin) setIsEditMode((prev) => !prev);
  };

  return (
    <EditModeContext.Provider value={{ isEditMode, toggleEditMode, canEdit: isAdmin }}>
      {children}
    </EditModeContext.Provider>
  );
};

export const useEditMode = () => useContext(EditModeContext);
