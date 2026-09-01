import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  browserLocalPersistence,
  connectAuthEmulator,
  getAuth,
  setPersistence,
  type Auth,
} from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  type AppCheck,
} from "firebase/app-check";
import { assertFirebaseConfig, env } from "../config/env";

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  appCheck?: AppCheck;
}

let servicesPromise: Promise<FirebaseServices> | undefined;

export function getFirebaseServices(): Promise<FirebaseServices> {
  if (servicesPromise) return servicesPromise;
  servicesPromise = (async () => {
    assertFirebaseConfig();
    const app = initializeApp(env.firebase);
    let db: Firestore;
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      });
    } catch {
      db = getFirestore(app);
    }
    const auth = getAuth(app);
    await setPersistence(auth, browserLocalPersistence);

    if (env.useEmulators) {
      connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
      connectFirestoreEmulator(db, "127.0.0.1", 8080);
    }

    let appCheck: AppCheck | undefined;
    if (!env.useEmulators && env.appCheckSiteKey) {
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(env.appCheckSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
    }
    return { app, auth, db, appCheck };
  })();
  return servicesPromise;
}
