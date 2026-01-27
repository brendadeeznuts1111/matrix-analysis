import { loadProfile } from "../lib/profile-loader";
import { maskValue } from "../lib/output";

export async function profileShow(name: string): Promise<void> {
  const profile = await loadProfile(name);

  if (!profile) {
    console.error(`\x1b[31mError: Profile "${name}" not found\x1b[0m`);
    process.exit(1);
  }

  console.log(`\x1b[1mProfile: ${profile.name}\x1b[0m`);
  console.log(`Version: ${profile.version}`);
  if (profile.author) {
    console.log(`Author: ${profile.author}`);
  }
  if (profile.created) {
    console.log(`Created: ${profile.created}`);
  }
  if (profile.description) {
    console.log(`Description: ${profile.description}`);
  }

  console.log(`\n\x1b[1mEnvironment Variables:\x1b[0m`);

  const rows = Object.entries(profile.env)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({
      Key: key,
      Value: maskValue(key, value),
    }));

  console.log(Bun.inspect.table(rows, undefined, { colors: true }));
}
