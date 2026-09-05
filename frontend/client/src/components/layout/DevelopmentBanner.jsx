const DevelopmentBanner = () => {
  const message = "LyZov Gentlemen is currently in development";

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