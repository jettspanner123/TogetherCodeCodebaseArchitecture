# Coding Rules

Add your rules below. Kiro will follow these before writing any code.

## General

- (e.g. Always use TypeScript, never use `any`)
- (e.g. Use as much code splitting, into components or controller as you can, the code space must be need and clean).
- (e.g. Always use singleon default exported function if the funciton is not a functional component.)

  ```typescript
  // Defination
  export default class SomeClass {
      public static current = new SomeClass();

      public function isWorking(): boolean {
          return true;
      }
  }

  // Useage
  SomeClass.current.isWorking();
  ```

- Everything should be fully typed:
  ```typescript
  export default function App(): React.JSX.Element {
      return (
          <View>
          </View>
      )
  }
  ```

## Styling

- (e.g. Use NativeWind/Tailwind classes only, no inline styles)
- (e.g. Take reference from `DESIGN.md` file before writing any code. )
- (e.g. Always write code for components and styles for dark mode only.)
- **All colors in the application are dynamically managed by `app/Stores/ApplicationBaselineColorStateStore.ts` and exposed through `app/Constants/ColorFactoryCON.tsx`. Never hardcode color strings (e.g. `"#fff"`, `"black"`, `"rgba(...)"`) anywhere in the codebase. If a new color token is required, add it to `ApplicationBaselineColorStateStoreInterface.ts`, define its value in the active palettes in `ApplicationBaselineColorStateStore.ts`, and expose a getter in `ColorFactoryCON.tsx`.**

  ```typescript
  // Wrong
  <View style={{ backgroundColor: "#111111" }} />

  // Correct
  import ColorFactoryCON from "@/Constants/ColorFactoryCON";
  <View style={{ backgroundColor: ColorFactoryCON.INK }} />
  ```

- **All padding, margin, gap, and spacing values must come from `app/Constants/EdgeInsetsCON.tsx`. Never hardcode a numeric spacing value inline. If the required value does not exist in `EdgeInsetsCON`, add it there first, then use it.**

  ```typescript
  // Wrong
  <View style={{ padding: 16, marginTop: 24 }} />

  // Correct
  import EdgeInsetsCON from "@/Constants/EdgeInsetsCON";
  <View style={{ padding: EdgeInsetsCON.LG, marginTop: EdgeInsetsCON.XL }} />
  ```

- (e.g. If you really need to use inline styles, create a file like `app/Features/${folderName}/Styles/HomeScreenStyles.tsx`, the name of the file should end with `*Styles`, and should be in PascalCase).

  ```typescript
  // Defination
  export default class HomeScreenStyles {
      public static BUTTON_STYLES = StyleSheet.create({
          BUTTON_WRAPPER: {}
      });
  }

  // Usage
  <View style={HomeScreenStyles.BUTTON_STYLES.BUTTON_WRAPPER}>
  </View>
  ```

## Components

- (e.g. Always use functional Components with named exports, `export default FunctionName()`)
- (e.g. Each file should have only one component, and that component should be `default export` please, no other function / class should be there in the file.)
- **Multi-Step Wizard / State Flow**: Always use a strongly typed TypeScript enum (defined in the feature's `Models/` folder) to track wizard steps or flow state, instead of hardcoded numbers.

## File Structure

- (e.g. If a component is only used in one file, the it should go in the `app/Features/${folderName}/Components/static/` folder, and the name of the file should be something like `${folderName}${componentName}StaticComponent`, example if the feature name is `HomeScreen` then `app/Features/HomeScreen/Components/static/HomeScreenHeroSectionStaticComponent.tsx`)
- (e.g. If a component is used in more than one file, the it should go in the `app/Features/${folderName}/Components/shared/` folder, example `app/Features/HomeScreen/Components/shared/HomeScreenButtonComponent.tsx`)
- (e.g. All enums, structs, interfaces, and classes used for data transfer, state options, or data representations must be stored in the `app/Features/${folderName}/Models/` folder inside each feature, and the file name should be in PascalCase ending with `.ts` or `.tsx` depending on whether they contain JSX.)
- **Global Types Folder**: All global TypeScript types, interfaces, enums, and type aliases must be stored inside separate files in the global `src/Types/` folder. Every type filename MUST end with `*Type.ts` (e.g. `AssetType.ts`, `EmployeeType.ts`, `ServiceTicketType.ts`, `NavigationType.ts`). No single monolithic `types.ts` file should exist.
- (e.g. Every features folder should have a root controller file, if the name of the folder is `app/Features/HomeScreen`, then this is the files / folder it should have.)
  Root Controller: `app/Features/HomeScreen/HomeScreenController.tsx`
  Static Components Folder: `app/Features/HomeScreen/Components/static`
  Shared Components Folder: `app/Features/HomeScreen/Components/shared`
  Service Folder: `app/Features/HomeScreen/Services`
  Controllers Components Folder: `app/Features/HomeScreen/Controllers`
  Constants Folder: `app/Features/HomeScreen/Constants`
  Models Folder: `app/Features/HomeScreen/Models`

## Naming

- (e.g. If a component that will have other Components in it should have the name `*ScreenController`, and should be in PascalCase, example, fileName: HomeScreenController.tsx, componentName: HomeScreenController)
- (e.g. If a component that does not have any other component in it should have the name `*ScreenComponent`, and should be in PascalCase, fileName: ButtonComponent.tsx, componentName: ButtonComponent)
- (e.g. All the constants should be stored in the `app/Features/${folderName}/Constants` or global `Constants/`)
  - The name of the constant file should end with `*CON`, should be in PascalCase, all the constant value in the constant class should be in full caps ( and should be public static readonly ).
  - **Strict Rule: No constants or static configuration arrays (e.g., list of options, tab setups, static layout lists) should reside inside controller or UI component files. They must always be defined in the constants file ending with `*CON` and imported.**
  - **Strict Rule: All `localStorage` key strings (e.g. `'ASSETSPHERE_ACCESS_TOKEN'`, `'ASSETSPHERE_REFRESH_TOKEN'`, `'ASSETSPHERE_AUTH_SESSION'`) must be defined inside a constant file ending with `*CON` in the `Constants/` folder, and the string values of those keys MUST BE IN ALL CAPS.**

  ```typescript
  // Definition
  export default class ApplicationLocalStorageCON {
    public static readonly ACCESS_TOKEN_STORAGE_KEY: string = "ASSETSPHERE_ACCESS_TOKEN";
  }

  // Usage
  const tokenKey = ApplicationLocalStorageCON.ACCESS_TOKEN_STORAGE_KEY;
  ```

- (e.g. All the controller views should be stored in the `app/Features/${folderName}/Controllers`)
  - The name of the controller file should end with `*Controller`, should be in PascalCase.

  ```typescript
  // Defination
  export default function HomeScreenTwinButtonController {
      return (
          <View>
          </View>
      )
  }

  // Usage
  <HomeScreenTwinButtonController />
  ```

- (e.g. All the helper class should be stored in the `app/Helpers`)
  - The name of the helper file should end with `*Helper`, should be in PascalCase. It should be a singleton.

  ```typescript
  // Defination
  export default class HomeScreenHelper {
      public static current = new HomeScreenHelper();

      public void doSomething() {

      }
  }

  // Usage
  HomeScreenHelper.current.doSomething();
  ```

- (e.g. All the util class should be stored in the `app/Utilities`)
  - The name of the helper file should end with `*Utility`, should be in PascalCase. It should be a singleton.

  ```typescript
  // Defination
  export default class HomeScreenUtility {
      public static current = new HomeScreenUtility();

      public void doSomething() {

      }
  }

  // Usage
  HomeScreenUtility.current.doSomething();
  ```

## Routes

- All route components must be placed in the `app/Routes/` folder.
- The file name must be in PascalCase and end with `*ScreenRoute.tsx` (e.g., `MyTransactionsScreenRoute.tsx`).
- The functional component name inside must match the file name exactly:

  ```typescript
  // File: app/Routes/MyTransactionsScreenRoute.tsx
  import React from "react";
  import MyTransactionsScreenController from "@/Features/MyTransactionsScreen/MyTransactionsScreenController";

  export default function MyTransactionsScreenRoute(): React.JSX.Element {
    return <MyTransactionsScreenController />;
  }
  ```

## Navigation

- **Always use `expo-router` native stack navigation (`router.push('/Routes/...')`, `router.back()`). Never use custom state wrappers or manual animated unmounts in `RootViewController.tsx` to simulate screen switching. Let Expo Router's native Stack navigator handle native `slide_from_right` transitions across screen routes.**
- **All navigation route targets must be defined and referenced as string constants from `app/Constants/ApplicationRouteCON.tsx`. Never hardcode raw string paths (like `"/Routes/MyTransactionsScreenRoute"`) directly inside component controllers. Always import `ApplicationRouteCON` and reference the corresponding static property (`ApplicationRouteCON.MY_TRANSACTIONS_SCREEN_ROUTE`).**

## Sensory & Physical Feedback

- **All physical and sensory feedback (such as device haptics, vibrations, and system sounds) must be routed through `app/Services/ApplicationPhysicalFeedback.ts`. Do not import `expo-haptics` or call its functions directly in components or controllers. Always use the centralized `ApplicationPhysicalFeedback` service singleton.**

  ```typescript
  // Wrong
  import * as Haptics from "expo-haptics";
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  // Correct
  import ApplicationPhysicalFeedback from "@/Services/ApplicationPhysicalFeedback";
  await ApplicationPhysicalFeedback.current.haptic.triggerHaptic();
  ```
