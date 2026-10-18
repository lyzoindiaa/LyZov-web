import { useEffect, useState } from "react";
import { settingsService } from "../../services/settingsService";

const DevelopmentBanner = () => {
  const [isDevMode, setIsDevMode] = useState(true);
  const [message, setMessage] = useState("LyZov is currently in development");

  useEffect(() => {
    let isMounted = true;
    settingsService
      .getSettings()
      .then((res) => {
        if (!isMounted) return;
        if (res?.data) {
          setIsDevMode(res.data.isDevelopmentMode ?? true);
          if (res.data.developmentMessage) {
            setMessage(res.data.developmentMessage);
          }
        }
      })
      .catch(() => {
        // Fallback to default if endpoint is unreachable
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isDevMode) return null;

  return (
    <div className="development-banner" role="status" aria-label="Development mode notice">
      <div className="development-banner__track">
        <span>{message}</span>
        <span aria-hidden="true">{message}</span>
      </div>
    </div>
  );
};

export default DevelopmentBanner;