export * from "ce/constants/SocialLogin";
import type { SocialLoginButtonProps as CE_SocialLoginButtonProps } from "ce/constants/SocialLogin";
import { SocialLoginButtonPropsList as CE_SocialLoginButtonPropsList } from "ce/constants/SocialLogin";
import { KeycloakOAuthURL, OIDCOAuthURL } from "./ApiConstants";
import KeyLogo from "assets/icons/ads/key-2-line.svg";

export type SocialLoginButtonProps = CE_SocialLoginButtonProps;
export const KeycloakSocialLoginButtonProps: SocialLoginButtonProps = {
  url: KeycloakOAuthURL,
  name: "samlProviderName",
  logo: KeyLogo,
};

export const OidcSocialLoginButtonProps: SocialLoginButtonProps = {
  url: OIDCOAuthURL,
  name: "oidcProviderName",
  logo: KeyLogo,
};

export const SocialLoginButtonPropsList: Record<
  string,
  SocialLoginButtonProps
> = {
  ...CE_SocialLoginButtonPropsList,
  saml: KeycloakSocialLoginButtonProps,
  oidc: OidcSocialLoginButtonProps,
};

export type SocialLoginType = keyof typeof SocialLoginButtonPropsList;
