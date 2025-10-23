import type { ComponentType } from 'react'

import { ArrowRightIcon, LockKeyholeIcon, SearchIcon, ShieldBanIcon, SmartphoneIcon, StarIcon, SwatchBookIcon } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

import { cn } from '@/lib/utils'

const featuresListPrepared = [
    {
      icon: SwatchBookIcon,
      title: 'User-Friendly Interface',
      description:
        "Navigate effortlessly with our intuitive design, optimised for all devices. Enjoy a seamless experience whether you're on a computer or mobile.",
      cardBorderColor: 'border-primary/40 hover:border-primary',
      avatarTextColor: 'text-primary',
      avatarBgColor: 'bg-primary/10'
    },
    {
      icon: ShieldBanIcon,
      title: 'Secure Checkout',
      description:
        'Enjoy a safe shopping experience with multiple payment options and SSL encryption. Your personal and financial information is always protected.',
      cardBorderColor: 'border-green-600/40 hover:border-green-600 dark:border-green-400/40 dark:hover:border-green-400',
      avatarTextColor: 'text-green-600 dark:text-green-400',
      avatarBgColor: 'bg-green-600/10 dark:bg-green-400/10'
    },
    {
      icon: SearchIcon,
      title: 'Advanced Search',
      description:
        'Find products quickly with advanced filters, sorting options, and suggestion. Save time and effortlessly locate exactly what you need with ease.',
      cardBorderColor: 'border-amber-600/40 hover:border-amber-600 dark:border-amber-400/40 dark:hover:border-amber-400',
      avatarTextColor: 'text-amber-600 dark:text-amber-400',
      avatarBgColor: 'bg-amber-600/10 dark:bg-amber-400/10'
    },
    {
      icon: StarIcon,
      title: 'Customer Reviews and Ratings',
      description:
        'Make informed decisions with detailed product reviews and ratings from other buyers. Trust the experiences of fellow shoppers to guide choices.',
      cardBorderColor: 'border-destructive/40 hover:border-destructive',
      avatarTextColor: 'text-destructive',
      avatarBgColor: 'bg-destructive/10'
    },
    {
      icon: SmartphoneIcon,
      title: 'Mobile App Integration',
      description:
        'Enhance your shopping experience with our mobile app and push notifications. Stay updated on arrivals and exclusive offers directly on phone.',
      cardBorderColor: 'border-sky-600/40 hover:border-sky-600 dark:border-sky-400/40 dark:hover:border-sky-400',
      avatarTextColor: 'text-sky-600 dark:text-sky-400',
      avatarBgColor: 'bg-sky-600/10 dark:bg-sky-400/10'
    },
    {
      icon: LockKeyholeIcon,
      title: 'Security Features',
      description:
        'Protect your data with fraud detection and two-factor authentication. Ensure a secure environment for all transactions and account activities.',
      cardBorderColor: 'border-primary/40 hover:border-primary',
      avatarTextColor: 'text-primary',
      avatarBgColor: 'bg-primary/10'
    }
  ]
  

type Features = {
  icon: ComponentType
  title: string
  description: string
  cardBorderColor: string
  avatarTextColor: string
  avatarBgColor: string
}[]

const Features = ({ featuresList = featuresListPrepared }: { featuresList?: Features }) => {
  return (
    <section className='py-8 sm:py-16 lg:py-24'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-12 space-y-4 sm:mb-16 lg:mb-24'>
          <h2 className='text-2xl font-semibold md:text-3xl lg:text-4xl'>Discover the Exclusive Perks Today</h2>
          <p className='text-muted-foreground text-xl'>
            Explore key features designed to enhance your shopping experience with intuitive navigation, robust
            security, and seamless functionality.
          </p>
          <Button variant='outline' className='rounded-lg text-base shadow-none has-[>svg]:px-6' size='lg' asChild>
            <a href='#'>
              See all features
              <ArrowRightIcon />
            </a>
          </Button>
        </div>

        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {featuresList.map((features, index) => (
            <Card key={index} className={cn('shadow-none transition-colors duration-300', features.cardBorderColor)}>
              <CardContent>
                <Avatar className={cn('mb-6 size-10 rounded-md', features.avatarTextColor)}>
                  <AvatarFallback className={cn('rounded-md [&>svg]:size-6', features.avatarBgColor)}>
                    <features.icon />
                  </AvatarFallback>
                </Avatar>
                <h6 className='mb-2 text-lg font-semibold'>{features.title}</h6>
                <p className='text-muted-foreground'>{features.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
