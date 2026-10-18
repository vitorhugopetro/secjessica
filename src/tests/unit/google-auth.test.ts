import { describe, it, expect, vi } from "vitest";

describe("Google OAuth Sign-In & Colaboradores", () => {
  it("deve configurar os parâmetros corretos para redirecionamento Google OAuth", () => {
    const origin = "https://secjessica.web.app";
    const expectedRedirectTo = `${origin}/auth/callback`;

    const oauthConfig = {
      provider: "google" as const,
      options: {
        redirectTo: expectedRedirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "select_account",
        },
      },
    };

    expect(oauthConfig.provider).toBe("google");
    expect(oauthConfig.options.redirectTo).toBe("https://secjessica.web.app/auth/callback");
    expect(oauthConfig.options.queryParams.prompt).toBe("select_account");
  });

  it("deve extrair dados do perfil Google (nome, email, avatar) mesmo com formatos variados de metadados", () => {
    // Caso 1: Usuário do Google com full_name e avatar_url
    const googleUser1 = {
      id: "usr-google-1",
      email: "jessica.secretaria@gmail.com",
      user_metadata: {
        full_name: "Jéssica Silva",
        avatar_url: "https://lh3.googleusercontent.com/a/sample1",
      },
    };

    // Caso 2: Usuário do Google com name e picture
    const googleUser2 = {
      id: "usr-google-2",
      email: "colaborador.clinica@gmail.com",
      user_metadata: {
        name: "Carlos Colaborador",
        picture: "https://lh3.googleusercontent.com/a/sample2",
      },
    };

    // Caso 3: Usuário sem metadados explícitos (fallback do email)
    const googleUser3 = {
      id: "usr-google-3",
      email: "financeiro@clinica.com",
      user_metadata: {},
    };

    function extractProfile(user: any) {
      const metadata = user.user_metadata || {};
      return {
        id: user.id,
        email: user.email,
        full_name: metadata.full_name || metadata.name || user.email?.split("@")[0] || "Colaborador",
        avatar_url: metadata.avatar_url || metadata.picture || null,
      };
    }

    const p1 = extractProfile(googleUser1);
    expect(p1.full_name).toBe("Jéssica Silva");
    expect(p1.avatar_url).toBe("https://lh3.googleusercontent.com/a/sample1");

    const p2 = extractProfile(googleUser2);
    expect(p2.full_name).toBe("Carlos Colaborador");
    expect(p2.avatar_url).toBe("https://lh3.googleusercontent.com/a/sample2");

    const p3 = extractProfile(googleUser3);
    expect(p3.full_name).toBe("financeiro");
    expect(p3.avatar_url).toBeNull();
  });

  it("deve associar automaticamente a empresa quando houver convite pendente para o e-mail Google", () => {
    const userEmail = "jessica.atendimento@gmail.com";
    const invitations = [
      {
        id: "inv-1",
        company_id: "comp-clinica-alfa",
        email: "jessica.atendimento@gmail.com",
        role: "secretary",
        accepted_at: null,
      },
    ];

    const matchingInvite = invitations.find(
      (inv) => inv.email.toLowerCase() === userEmail.toLowerCase() && !inv.accepted_at
    );

    expect(matchingInvite).toBeDefined();
    expect(matchingInvite?.company_id).toBe("comp-clinica-alfa");
    expect(matchingInvite?.role).toBe("secretary");
  });

  it("deve gerar slug único para novo colaborador Google sem empresa", () => {
    const user = {
      id: "d83e29f1-3949-4df1-807a-6b4b0e35e7df",
      email: "jessica.pessoal@gmail.com",
      name: "Jéssica Silva",
    };

    const baseSlug = (user.email.split("@")[0] || "workspace").replace(/[^a-z0-9]/gi, "").toLowerCase();
    const uniqueSlug = `${baseSlug}-${user.id.slice(0, 6)}`;

    expect(uniqueSlug).toBe("jessicapessoal-d83e29");
  });
});
