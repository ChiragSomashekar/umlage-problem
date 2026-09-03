import { useEffect, useLayoutEffect, useState } from "react";

// measures a ref'd container and re-measures on window resize, so a resize is just a state change
export const useDimensions = (targetRef) => {
  const getDimensions = () => ({
    width: targetRef.current ? targetRef.current.offsetWidth : 0,
    height: targetRef.current ? targetRef.current.offsetHeight : 0,
  });

  const [dimensions, setDimensions] = useState(getDimensions);

  const handleResize = () => setDimensions(getDimensions());

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useLayoutEffect(() => {
    handleResize();
  }, []);

  return dimensions;
};
