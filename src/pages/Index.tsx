import React from 'react';
import Header from '@/components/Header';
import CourseGraph from '@/components/CourseGraph';
import FileUpload from '@/components/FileUpload';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-8rem)]">
          {/* File Upload Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <FileUpload />
            
            {/* Legend */}
            <div className="academic-card p-4">
              <h3 className="text-sm font-semibold mb-3">Course Types</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-primary"></div>
                  <span>Core CS Courses</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-secondary"></div>
                  <span>Advanced CS</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-accent"></div>
                  <span>Specialization</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-muted border border-border"></div>
                  <span>Prerequisites</span>
                </div>
              </div>
            </div>
          </div>

          {/* Course Graph Main Area */}
          <div className="lg:col-span-3">
            <div className="h-full">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-foreground">
                  Course Requirements Graph
                </h2>
                <p className="text-muted-foreground">
                  Interactive visualization of your academic pathway
                </p>
              </div>
              <CourseGraph className="h-[calc(100%-4rem)]" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
