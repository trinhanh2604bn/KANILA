import { Routes } from '@angular/router';
import { ClientLayout } from './layout/client-layout/client-layout';

import { Mainpage } from './features/home/pages/mainpage/mainpage';
import { CommunityComponent } from './features/community/communityhome/community';
import { PostDetailPage } from './features/community/gallery/post-detail/post-detail';
import { GalleryPage } from './features/community/gallery/gallery';
import { GalleryDetailPage } from './features/community/gallery/gallery-detail/gallery-detail';
import { ChallengesPage } from './features/community/challenges/challenges';
import { ChallengeDetailPage } from './features/community/challenges/challenge-detail/challenge-detail';
import { ChallengeJoinPage } from './features/community/challenges/challenge-join/challenge-join';
import { ProfilePage } from './features/community/profile/profile';
export const routes: Routes = [
    { path: '', redirectTo: 'mainpage', pathMatch: 'full' },
    { path: 'mainpage', component: Mainpage },
    {
        path: '',
        component: ClientLayout,
        children: [
            { path: 'community', redirectTo: 'community/communityhome', pathMatch: 'full' },
            { path: 'community/communityhome', component: CommunityComponent },
            { path: 'community/gallery', component: GalleryPage },
            { path: 'community/gallery/:id', component: GalleryDetailPage },
            { path: 'community/challenges/:id/join', component: ChallengeJoinPage },
            { path: 'community/challenges/:id', component: ChallengeDetailPage },
            { path: 'community/challenges', component: ChallengesPage },
            { path: 'community/profile', component: ProfilePage },
            { path: 'community/post/:id', component: PostDetailPage },
    
            {path: 'auth',
            loadChildren: () => import('./features/auth/auth-routing.module').then(m => m.AuthRoutingModule)},
        ]
      },
    { path: '**', redirectTo: 'mainpage' }
    
];