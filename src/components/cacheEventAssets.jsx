// src/components/cacheEventAssets.jsx

import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { prefetchAssetsFromJson } from "../services/assetCache";
import LocalAssets from "../assets/assets";

const baseURL = import.meta.env.VITE_BASE_URL;

// 
export default function CacheEventAssets() {
  const dispatch = useDispatch();
  const event = useSelector((s) => s.event.event);
  const teams = useSelector((s) => s.teams.items);
  const refresh = useSelector((s) => s.session.refresh);

  const prefechLocalAssets = () => {
    let localAssets = [];
    for (const asset of LocalAssets) {
      let assetURL = baseURL + '/src/assets/' + asset;
      localAssets.push(assetURL);
    }
    prefetchAssetsFromJson(localAssets);
  }

  useEffect(() => {
    prefechLocalAssets();
  }, []);

  useEffect(() => {
    if (!event) return;
    prefetchAssetsFromJson([event, ...teams]);
  }, [event, dispatch, refresh]);

  return null;
}



