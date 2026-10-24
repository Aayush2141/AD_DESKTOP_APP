const fs = require('fs');
const path = require('path');

exports.default = async function(context) {
  const appOutDir = context.appOutDir;
  const appName = context.packager.appInfo.productFilename;
  const frameworkResources = path.join(
    appOutDir,
    `${appName}.app`,
    'Contents/Frameworks/Electron Framework.framework/Versions/A/Resources'
  );

  if (fs.existsSync(frameworkResources)) {
    const files = fs.readdirSync(frameworkResources);
    for (const file of files) {
      if (file.endsWith('.lproj') && file !== 'en.lproj') {
        const fullPath = path.join(frameworkResources, file);
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
    }
  }
};
