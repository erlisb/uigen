import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getAnonWorkData as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (getProjects as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (createProject as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "new-project-id" });
  });

  describe("initial state", () => {
    test("isLoading starts as false", () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(false);
    });

    test("exposes signIn, signUp, and isLoading", () => {
      const { result } = renderHook(() => useAuth());
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
      expect(typeof result.current.isLoading).toBe("boolean");
    });
  });

  describe("signIn", () => {
    test("sets isLoading to true during sign in and false after", async () => {
      let resolveSignIn!: (value: any) => void;
      (signInAction as ReturnType<typeof vi.fn>).mockReturnValue(
        new Promise((res) => { resolveSignIn = res; })
      );

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.signIn("user@example.com", "password123");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignIn({ success: false, error: "Invalid credentials" });
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("calls signInAction with provided credentials", async () => {
      (signInAction as ReturnType<typeof vi.fn>).mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(signInAction).toHaveBeenCalledWith("user@example.com", "password123");
    });

    test("returns the result from signInAction", async () => {
      const mockResult = { success: false, error: "Invalid credentials" };
      (signInAction as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const { result } = renderHook(() => useAuth());
      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signIn("user@example.com", "wrongpass");
      });

      expect(returnValue).toEqual(mockResult);
    });

    test("does not call handlePostSignIn on failure", async () => {
      (signInAction as ReturnType<typeof vi.fn>).mockResolvedValue({ success: false, error: "Invalid" });

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("user@example.com", "wrongpass");
      });

      expect(mockPush).not.toHaveBeenCalled();
      expect(createProject).not.toHaveBeenCalled();
    });

    test("resets isLoading to false even when signInAction throws", async () => {
      (signInAction as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("user@example.com", "password123").catch(() => {});
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("signUp", () => {
    test("sets isLoading to true during sign up and false after", async () => {
      let resolveSignUp!: (value: any) => void;
      (signUpAction as ReturnType<typeof vi.fn>).mockReturnValue(
        new Promise((res) => { resolveSignUp = res; })
      );

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.signUp("newuser@example.com", "password123");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignUp({ success: false, error: "Email already registered" });
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("calls signUpAction with provided credentials", async () => {
      (signUpAction as ReturnType<typeof vi.fn>).mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signUp("newuser@example.com", "password123");
      });

      expect(signUpAction).toHaveBeenCalledWith("newuser@example.com", "password123");
    });

    test("returns the result from signUpAction", async () => {
      const mockResult = { success: false, error: "Email already registered" };
      (signUpAction as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const { result } = renderHook(() => useAuth());
      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signUp("existing@example.com", "password123");
      });

      expect(returnValue).toEqual(mockResult);
    });

    test("does not call handlePostSignIn on failure", async () => {
      (signUpAction as ReturnType<typeof vi.fn>).mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signUp("user@example.com", "password123");
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    test("resets isLoading to false even when signUpAction throws", async () => {
      (signUpAction as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signUp("user@example.com", "password123").catch(() => {});
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("post sign-in navigation", () => {
    describe("when anonymous work exists", () => {
      const anonWork = {
        messages: [{ role: "user", content: "Build me a dashboard" }],
        fileSystemData: { "/App.jsx": { type: "file", content: "<App />" } },
      };

      beforeEach(() => {
        (getAnonWorkData as ReturnType<typeof vi.fn>).mockReturnValue(anonWork);
        (signInAction as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
        (createProject as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "anon-project-id" });
      });

      test("creates a project with anonymous work data", async () => {
        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(createProject).toHaveBeenCalledWith({
          name: expect.stringMatching(/^Design from /),
          messages: anonWork.messages,
          data: anonWork.fileSystemData,
        });
      });

      test("clears anonymous work after creating project", async () => {
        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(clearAnonWork).toHaveBeenCalled();
      });

      test("redirects to the newly created project", async () => {
        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(mockPush).toHaveBeenCalledWith("/anon-project-id");
      });

      test("does not fetch existing projects when anon work exists", async () => {
        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(getProjects).not.toHaveBeenCalled();
      });

      test("works the same way after signUp", async () => {
        (signUpAction as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });

        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signUp("newuser@example.com", "password123");
        });

        expect(createProject).toHaveBeenCalledWith({
          name: expect.stringMatching(/^Design from /),
          messages: anonWork.messages,
          data: anonWork.fileSystemData,
        });
        expect(clearAnonWork).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/anon-project-id");
      });
    });

    describe("when no anonymous work exists and user has existing projects", () => {
      const existingProjects = [
        { id: "project-1", name: "My Dashboard" },
        { id: "project-2", name: "Old Project" },
      ];

      beforeEach(() => {
        (getAnonWorkData as ReturnType<typeof vi.fn>).mockReturnValue(null);
        (signInAction as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
        (getProjects as ReturnType<typeof vi.fn>).mockResolvedValue(existingProjects);
      });

      test("redirects to the most recent project", async () => {
        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(mockPush).toHaveBeenCalledWith("/project-1");
      });

      test("does not create a new project", async () => {
        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(createProject).not.toHaveBeenCalled();
      });

      test("does not clear anon work", async () => {
        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(clearAnonWork).not.toHaveBeenCalled();
      });
    });

    describe("when no anonymous work and no existing projects", () => {
      beforeEach(() => {
        (getAnonWorkData as ReturnType<typeof vi.fn>).mockReturnValue(null);
        (signInAction as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
        (getProjects as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        (createProject as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "brand-new-id" });
      });

      test("creates a new empty project", async () => {
        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(createProject).toHaveBeenCalledWith({
          name: expect.stringMatching(/^New Design #\d+$/),
          messages: [],
          data: {},
        });
      });

      test("redirects to the new project", async () => {
        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(mockPush).toHaveBeenCalledWith("/brand-new-id");
      });
    });

    describe("when anonymous work exists but has no messages", () => {
      beforeEach(() => {
        (getAnonWorkData as ReturnType<typeof vi.fn>).mockReturnValue({
          messages: [],
          fileSystemData: {},
        });
        (signInAction as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
        (getProjects as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: "existing-id" }]);
      });

      test("falls through to checking existing projects", async () => {
        const { result } = renderHook(() => useAuth());
        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(getProjects).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/existing-id");
        expect(clearAnonWork).not.toHaveBeenCalled();
      });
    });
  });
});
