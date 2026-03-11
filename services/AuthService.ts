"use server";
import "server-only";
import { User } from "@/types/types";
import bcrypt from "bcryptjs";
import { prisma } from "@/prisma/client";
import { UserRole } from "@prisma/client";
import { auth, signIn, unstable_update } from "@/auth";
import { redirect } from "next/navigation";
import { CONST } from "@/utils/constants";
import { AuthError } from "next-auth";
import { revalidateTag } from "next/cache";

const getUserByEmail = async (email: string | null) => {
  if (!email) return null;
  const user = await prisma.user.findUnique({ where: { email } });
  return user;
};

const getDashboardDetails = async (email: string | null) => {
  if (!email) return null;
  try {

    const userDashboardData = await prisma.user.findUnique({
      where: { email },
      include: {
        teams: {
          include: {
            event: true,
            members: {
              select: { name: true, image: true }
            }
          }
        },
        pendingTeams: {
          include: {
            event: true
          }
        },
        notifications: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        merchandise: true,
        workshops: true
      }
    });
    return userDashboardData;
  } catch (err) {
    console.error("Dashboard Fetch Error:", err);
    return null;
  }
};

const validateUser = async (user: User | null, password: string) => {
  if (!user || !user.password) return false;

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) return false;
  return true;
};

const handleSignin = async (email: string, password: string) => {
  if (!email || !password) return { ok: false, message: "Email and password required" };
  try {
    const user = await getUserByEmail(email);
    if (user && (user.role === "ADMIN" || user.role === "SUPERADMIN")) {
       const isValid = await validateUser(user as User, password);
       if (isValid) {
         revalidateTag("admin-events", {});
         revalidateTag("superadmin-users", {});
         revalidateTag("superadmin-merch", {});
         revalidateTag("event-participants", {});
         revalidateTag("event-admins", {});
         revalidateTag("live-events", {});
       }
    }

    await signIn("credentials", {
      email,
      password,
      redirect: false
    });
    return { ok: true, message: "Login successful" };
  } catch (err) {
    console.error(err);
    if (err instanceof AuthError && err.type === "CredentialsSignin")
      return { ok: false, message: "Invalid credentials" };
    else
      return { ok: false, message: "Error in login" };
  }
}

const verifyCaptchaToken = async (token: string | null) => {
  if (!token) return false;

  const captchaBody = new URLSearchParams([
    ["secret", CONST.hcaptcha.SECRET || ""],
    ["response", token],
    ["sitekey", CONST.hcaptcha.SITEKEY || ""],
  ]);

  const captchaResponse = await fetch(CONST.hcaptcha.VERIFICATION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: captchaBody.toString(),
  });

  if (!captchaResponse.ok) return false;
  const captchaStatus = await captchaResponse.json();
  return captchaStatus.success;
};

const signup = async (user: User, hCaptchaToken: string | null) => {
  try {
    const validCaptcha = await verifyCaptchaToken(hCaptchaToken);
    if (!validCaptcha)
      return { ok: false, message: "Captcha Verification Failed" };

    if (!user.password)
      return { ok: false, message: "Password is required" };

    const existingUser = await getUserByEmail(user.email);
    if (existingUser)
      return { ok: false, message: "Email already in use" };

    const hashedPassword = await bcrypt.hash(user.password, 12);
    // Destructure referralCode to exclude it from the database write
    const { referralCode, ...userData } = user;
    const dbUser = {
      ...userData,
      password: hashedPassword,
      role: userData.role as UserRole
    };

    await prisma.user.create({ data: dbUser });

    if (referralCode) {
      try {
        await prisma.campusAmbassador.update({
          where: { referralCode: referralCode },
          data: { referralCount: { increment: 1 } },
        });
      } catch (err) {
        console.error(`Error incrementing CA count: ${err}`);
      }
    }

    try {
      await signIn("credentials", {
        email: user.email,
        password: user.password,
        redirect: false
      });
    } catch (err) {
      console.error(err);
      return { ok: false, message: "Error in login after signup, please login manually" };
    }
    return { ok: true, message: "Signup successful" };
  } catch (err) {
    console.error(err);
    return { ok: false, message: "Error in signup" };
  }
};

const checkAuthentication = async (redirectUrl = "") => {
  const session = await auth();
  const encodedRedirectUrl = encodeURIComponent(redirectUrl);
  if (!session || !session.user || !session.user.id)
    redirect(`/login?redirect=${encodedRedirectUrl}`);

  if (redirectUrl.indexOf("dashboard") !== -1) return session.user;

  if (!session.user.emailVerified || !session.user.registrationComplete)
    redirect(`/dashboard?redirect=${encodedRedirectUrl}`);


  return session.user;
};

const checkAdminAuthorization = async () => {
  const session = await auth();

  if (!session || !session.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
    redirect("/admin/login");
  }
  return session.user;
};

const checkSuperAdminAuthorization = async () => {
  const session = await auth();

  if (
    !session ||
    !session.user ||
    session.user.role !== "SUPERADMIN"
  ) {
    redirect("/admin/login");
  }

  return session.user;
};

const checkRegistrationStatus = async (id: string | undefined) => {
  if (!id) return { emailVerified: null, registrationComplete: false };
  const user = await prisma.user.findUnique({
    where: { id },
    select: { emailVerified: true, registrationComplete: true },
  });
  if (!user) return { emailVerified: null, registrationComplete: false };
  return user;
};

const updateVerification = async () => {
  const res = await unstable_update({ user: { emailVerified: new Date() } });
  return res;
};

const updateRegistrationStatus = async () => {
  const res = await unstable_update({ user: { registrationComplete: true } });
  return res;
};

// services/AuthService.ts
export type AuthUser = {
  id: string;
  email: string;
  role: string;
  referralCode?: string;
};

export {
  getUserByEmail,
  getDashboardDetails,
  validateUser,
  handleSignin,
  signup,
  checkAuthentication,
  checkAdminAuthorization,
  checkSuperAdminAuthorization,
  checkRegistrationStatus,
  updateVerification,
  updateRegistrationStatus,
};
