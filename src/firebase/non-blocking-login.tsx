'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
  // Assume getAuth and app are initialized elsewhere
} from 'firebase/auth';
import { FirebaseError, getApp } from 'firebase/app';
import { setDocumentNonBlocking } from './non-blocking-updates';
import { doc } from 'firebase/firestore';
import { getSdks } from '.';

type ErrorCallback = (error: FirebaseError) => void;

function createProfile(userCredential: UserCredential, firstName: string, lastName: string) {
    const { firestore } = getSdks(getApp());
    const user = userCredential.user;
    const profileRef = doc(firestore, 'users', user.uid);
    setDocumentNonBlocking(profileRef, {
        id: user.uid,
        email: user.email,
        firstName: firstName,
        lastName: lastName,
        createdAt: new Date().toISOString(),
    }, { merge: true });
}

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth, onError?: ErrorCallback): void {
  signInAnonymously(authInstance).catch(onError);
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string, firstName: string, lastName: string, onError?: ErrorCallback): void {
  createUserWithEmailAndPassword(authInstance, email, password)
    .then((userCredential) => createProfile(userCredential, firstName, lastName))
    .catch(onError);
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string, onError?: ErrorCallback): void {
  signInWithEmailAndPassword(authInstance, email, password).catch(onError);
}
