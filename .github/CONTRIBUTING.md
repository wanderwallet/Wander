# Contributing to Wander

Thank you for your interest in contributing to the Wander extension! Below are the guidelines to help you get started.

> **Important:** Always work from the "development" branch when making contributions. This ensures your changes are based on the latest development version.

## Building the Project

1. **Clone the Repository:** Clone this repository to your local machine.

2. **Open Terminal:** Navigate to the root directory of the project.

3. **Install Dependencies:** We use Yarn as our package manager. Run the following command to install the necessary dependencies:

   ```sh
   yarn install
   ```

4. **Build the extension:**

   1. **Build from Source:** To build the extension for a specific target, run the build command followed by the target name. For example, to build for Chrome, use:

   ```sh
   yarn build:chrome
   ```

   2. **Development Mode:** If you want to enable hot-code reloading, run:

   ```sh
   yarn dev:chrome
   ```

5. **Load the Extension:**
   - The compiled extension will be located in the `build` folder.
   - To load it in Chrome or Brave, open the extensions manager and click "Load unpacked" (ensure developer mode is enabled).
   - Select the `dev-chrome-mv3` folder for development mode or `build-chrome-mv3` for the production build.

## Commits and Code Style

1. **Code Formatting:** Please adhere to the Prettier configuration provided. To format your code, run:

   ```sh
   yarn fmt
   ```

2. **Commit Messages:** Follow the Conventional Commits guidelines for your commit messages. An example commit message is:

   ```sh
   feat: add more cool stuff
   ```

   For more details on best practices, refer to [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#summary).

## Internationalization (i18n)

We currently support English and Simplified Chinese.

Please place all UI text in `messages.json` within the appropriate locale folder (located in `/assets/_locales/`).

## Required Languages

This project is built using Plasmo, TypeScript, and React Styled Components.

Thank you again for contributing! 😊
