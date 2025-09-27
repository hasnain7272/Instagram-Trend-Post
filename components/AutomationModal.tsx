import React from 'react';
import { XIcon } from './icons';

const Step: React.FC<{ number: number; title: string; children: React.ReactNode }> = ({ number, title, children }) => (
  <div>
    <h3 className="text-lg font-semibold text-gray-100 mb-2">
      <span className="text-purple-400 mr-2">{number}.</span>{title}
    </h3>
    <div className="text-sm text-gray-400 space-y-2 pl-6">{children}</div>
  </div>
);

const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => <code className="bg-gray-700/50 text-purple-300 px-1.5 py-1 rounded-md text-xs">{children}</code>;

const AutomationModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-40 p-4" onClick={onClose}>
      <div style={{maxHeight: '90vh'}} className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl border border-gray-700/50 flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                Deployment & Automation Guide
            </h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-700 transition-colors">
                <XIcon className="h-6 w-6 text-gray-400" />
            </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
            <div className="bg-green-900/50 border border-green-700/60 text-green-200 p-4 rounded-md">
                <h3 className="font-bold mb-1">Project Upgraded!</h3>
                <p className="text-sm">This project now uses a professional build system (Vite) and includes GitHub Actions for automated deployment and post generation. Follow the steps below to get everything running.</p>
            </div>

            <div>
                <h2 className="text-xl font-bold text-gray-100 mb-4 border-b border-gray-700 pb-2">Part A: Deploying to GitHub Pages</h2>
                <div className="space-y-4">
                  <Step number={1} title="Update the Vite Config">
                    <p>Open the <Code>vite.config.ts</Code> file. Change the value of <Code>base</Code> to match your GitHub repository name.</p>
                    <p>For example, if your repository URL is <Code>github.com/your-name/my-cool-project</Code>, set <Code>base: '/my-cool-project/'</Code>.</p>
                  </Step>
                   <Step number={2} title="Enable GitHub Pages">
                    <p>In your GitHub repository, go to <Code>Settings</Code> &gt; <Code>Pages</Code>.</p>
                    <p>Under "Build and deployment", set the <Code>Source</Code> to <Code>Deploy from a branch</Code>.</p>
                     <p>Set the branch to <Code>gh-pages</Code> and the folder to <Code>/ (root)</Code>, then click <Code>Save</Code>.</p>
                  </Step>
                  <Step number={3} title="Push to Main">
                    <p>That's it! Every time you push to the <Code>main</Code> branch, the included GitHub Action will automatically build and deploy your site to the <Code>gh-pages</Code> branch.</p>
                    <p>Your live site will be available at <Code>https://your-username.github.io/your-repo-name/</Code>.</p>
                  </Step>
                </div>
            </div>

             <div>
                <h2 className="text-xl font-bold text-gray-100 mb-4 border-b border-gray-700 pb-2">Part B: Automating Instagram Posts</h2>
                 <p className="text-sm text-gray-400 mb-4">A secure Node.js script and GitHub Action are now included to automatically generate and publish posts for you.</p>
                <div className="space-y-4">
                  <Step number={1} title="Add Repository Secrets">
                    <p>In your GitHub repository, go to <Code>Settings</Code> &gt; <Code>Secrets and variables</Code> &gt; <Code>Actions</Code>.</p>
                    <p>Click <Code>New repository secret</Code> and add the following secrets. These are used by the automation script.</p>
                    <ul className="list-disc list-inside space-y-1 mt-2 pl-2">
                      <li><Code>API_KEY</Code> (Your Google Gemini API Key)</li>
                      <li><Code>INSTAGRAM_ACCOUNT_ID</Code></li>
                      <li><Code>INSTAGRAM_ACCESS_TOKEN</Code></li>
                      <li><Code>CLOUDINARY_CLOUD_NAME</Code></li>
                      <li><Code>CLOUDINARY_UPLOAD_PRESET</Code></li>
                    </ul>
                  </Step>
                  <Step number={2} title="Run the Workflow">
                      <p>Go to the <Code>Actions</Code> tab in your GitHub repository.</p>
                      <p>You will see a workflow named "Generate and Post to Instagram". Click on it.</p>
                      <p>You can run this workflow manually by clicking <Code>Run workflow</Code>, or it will run automatically on the schedule defined in the file.</p>
                  </Step>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AutomationModal;
