import { useToast as useChakraToast } from "@chakra-ui/toast";

export const useGameToast = () => {
  const toast = useChakraToast();

  const toastError = (title: string, message: string) => {
    toast({
      title: title,
      duration: 6000,
      description: message,
      status: "error",
      isClosable: true,
      position: "top",
    });
  };

  const toastInfo = (title: string, message?: string) => {
    toast({
      title: title,
      duration: 3000,
      description: message,
      status: "info",
      isClosable: true,
      position: "top",
    });
  };

  const toastOk = (title: string, message?: string) => {
    toast({
      title: title,
      duration: 3000,
      description: message,
      status: "success",
      isClosable: true,
      position: "bottom",
    });
  };

  return { toastError, toastInfo, toastOk };
};
